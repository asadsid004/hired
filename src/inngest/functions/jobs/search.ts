import { inngest } from "@/inngest/client";
import { db } from "@/db/drizzle";
import { Job } from "@/db/schema/jobs-schema";
import { JobsService } from "@/server/modules/jobs/jobs.service";
import { user, jobPreferences as JobPreferences, JobPreference, userJobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export type JobSearchEvent = {
    name: "hired/jobs.search";
    data: {
        userId: string;
    };
};

export const searchJobs = inngest.createFunction(
    { id: "search-jobs" },
    { event: "hired/jobs.search" },
    async ({ event, step }) => {
        const { userId } = event.data;

        // 1. Get user data
        const { preferences, profile, profileEmbedding } = await step.run("get-user-data", async () => {
            const userData = await db.query.user.findFirst({
                where: eq(user.id, userId),
            });
            const dbPreferences = await db.query.jobPreferences.findFirst({
                where: eq(JobPreferences.userId, userId),
            });

            if (!userData || !dbPreferences) {
                throw new Error("User or preferences not found");
            }

            return {
                profile: userData.profile,
                profileEmbedding: userData.profileEmbedding,
                preferences: dbPreferences as JobPreference,
            };
        });

        if (!profile || !profileEmbedding) {
            return { message: "No resume profile available to match jobs." };
        }

        // 2. Fetch jobs from TheirStack
        const rawJobsResult = await step.run("fetch-jobs", async () => {
            const results = await JobsService.getJobs({
                ...preferences,
                createdAt: new Date(preferences.createdAt),
                updatedAt: new Date(preferences.updatedAt),
            } as JobPreference, profile.experience);
            return results;
        });

        if (!rawJobsResult.data || rawJobsResult.data.length === 0) {
            return { message: "No jobs found for these preferences." };
        }

        const validJobs = rawJobsResult.data;
        const validJobsExtended = [...rawJobsResult.data];

        // 3. Prepare jobs for database and embedding
        const { newJobsToSave } = await step.run("prepare-jobs", async () => {
            const currentJobIds = validJobs.map(j => j.id);
            const existingJobsInDb = await db.query.jobs.findMany({
                where: (jobs, { inArray }) => inArray(jobs.id, currentJobIds),
                columns: { id: true }
            });
            const existingIds = new Set(existingJobsInDb.map(j => j.id));

            const newJobsToSave = validJobs.filter(j => !existingIds.has(j.id));
            return { newJobsToSave };
        });

        // 4. Generate embeddings only for completely new jobs
        const embeddingsMap = await step.run("embed-new-jobs", async () => {
            if (newJobsToSave.length === 0) return {};

            const textsToEmbed = newJobsToSave.map(j => JobsService.prepareJobForEmbedding(j));
            const embeddings = await JobsService.generateJobEmbeddings(textsToEmbed);

            const map: Record<number, number[]> = {};
            newJobsToSave.forEach((job, index) => {
                map[job.id] = embeddings[index];
            });

            return map;
        });

        // 5. Save raw Jobs to Database
        await step.run("save-jobs", async () => {
            if (newJobsToSave.length === 0) return;

            const jobsInsertions = newJobsToSave.map(job => {
                const firstHiringTeamMember = job.hiring_team?.[0];
                return {
                    id: job.id,
                    jobTitle: job.job_title,
                    normalizedTitle: job.normalized_title,
                    description: job.description,
                    url: job.url,
                    company: job.company,
                    companyDomain: job.company_domain,
                    companyLogo: job.company_object?.logo,
                    companyIndustry: job.company_object?.industry,
                    // integer column — API can return floats
                    companyEmployeeCount: job.company_object?.employee_count != null
                        ? Math.round(job.company_object.employee_count)
                        : null,
                    companyCountryCode: job.company_object?.country_code,
                    companyDescription: job.company_object?.seo_description,
                    companyLinkedinUrl: job.company_object?.linkedin_url,
                    // integer column — API can return floats
                    companyFoundedYear: job.company_object?.founded_year != null
                        ? Math.round(job.company_object.founded_year)
                        : null,
                    companyTechnologySlugs: job.company_object?.technology_slugs,
                    location: job.location,
                    shortLocation: job.short_location,
                    stateCode: job.state_code,
                    countryCode: job.country_code,
                    // boolean columns — default false if API returns null/undefined
                    remote: job.remote ?? false,
                    hybrid: job.hybrid ?? false,
                    latitude: job.latitude != null ? job.latitude.toString() : null,
                    longitude: job.longitude != null ? job.longitude.toString() : null,
                    salaryString: job.salary_string,
                    // integer columns — API returns floats like (min+max)/2
                    minAnnualSalaryUsd: job.min_annual_salary_usd != null
                        ? Math.round(job.min_annual_salary_usd)
                        : null,
                    maxAnnualSalaryUsd: job.max_annual_salary_usd != null
                        ? Math.round(job.max_annual_salary_usd)
                        : null,
                    avgAnnualSalaryUsd: job.avg_annual_salary_usd != null
                        ? Math.round(job.avg_annual_salary_usd)
                        : null,
                    seniority: job.seniority,
                    employmentStatuses: job.employment_statuses,
                    technologySlugs: job.technology_slugs,
                    datePosted: job.date_posted ? new Date(job.date_posted) : new Date(),
                    discoveredAt: job.discovered_at ? new Date(job.discovered_at) : null,
                    // boolean columns — default false if API returns null/undefined
                    reposted: job.reposted ?? false,
                    dateReposted: job.date_reposted ? new Date(job.date_reposted) : null,
                    easyApply: job.easy_apply ?? false,
                    hiringTeamFirstName: firstHiringTeamMember?.first_name ?? null,
                    hiringTeamLastName: firstHiringTeamMember
                        ? firstHiringTeamMember.full_name.replace(firstHiringTeamMember.first_name, '').trim()
                        : null,
                    hiringTeamLinkedinUrl: firstHiringTeamMember?.linkedin_url ?? null,
                    embedding: embeddingsMap[job.id] ?? null,
                };
            });

            await JobsService.saveJobs(jobsInsertions, []);
        });

        // 5.5 Fetch existing jobs from DB that match the preference hash
        const prefHash = JobsService.generatePreferenceHash({
            ...preferences
        });

        const existingMatchingJobs = await step.run("fetch-existing-matched-jobs", async () => {
            const currentJobIds = new Set(validJobs.map(j => j.id));

            // Find all jobIds that have been matched against this prefHash in the past
            const matchedUserJobs = await db.query.userJobs.findMany({
                where: eq(userJobs.preferencesHash, prefHash),
                columns: { jobId: true }
            });

            const matchedJobIds = new Set(matchedUserJobs.map(uj => uj.jobId));
            currentJobIds.forEach(id => matchedJobIds.delete(id));

            if (matchedJobIds.size === 0) return [];

            const dbJobs = await db.query.jobs.findMany({
                where: (jobs, { inArray }) => inArray(jobs.id, Array.from(matchedJobIds))
            });

            return dbJobs;
        });

        existingMatchingJobs.forEach(dbJob => {
            validJobsExtended.push({
                id: dbJob.id,
                job_title: dbJob.jobTitle,
                description: dbJob.description,
                url: dbJob.url,
                company: dbJob.company,
                location: dbJob.location ?? "",
                country_code: dbJob.countryCode ?? "",
                remote: dbJob.remote ?? false,
                hybrid: dbJob.hybrid ?? false,
                employment_statuses: dbJob.employmentStatuses ?? [],
                technology_slugs: dbJob.technologySlugs ?? [],
            } as typeof validJobsExtended[0]);
        });

        // 6. Compute Similarities using PG Vector
        const jobScores = await step.run("compute-similarities", async () => {
            const allJobIds = validJobsExtended.map(j => j.id);
            return await JobsService.computeSimilarityInDb(userId, allJobIds);
        });

        // 7. Generate top matches and save UserJob connections
        await step.run("save-user-jobs-with-reasoning", async () => {
            // Sort by score
            const sortedScoredJobs = [...jobScores].sort((a, b) => b.score - a.score);

            const userJobsInsertions = sortedScoredJobs.map((scoreObj) => {
                const jobData = validJobsExtended.find(j => j.id === scoreObj.jobId)!;
                const mappedJobData = {
                    id: jobData.id,
                    jobTitle: jobData.job_title,
                    description: jobData.description,
                    url: jobData.url,
                    company: jobData.company,
                    location: jobData.location,
                    countryCode: jobData.country_code,
                    remote: jobData.remote,
                    hybrid: jobData.hybrid,
                    employmentStatuses: jobData.employment_statuses,
                    technologySlugs: jobData.technology_slugs,
                };

                // Basic rule-based reasoning
                const reasonsArray = JobsService.getRuleBasedMatchReasons(mappedJobData as Job, preferences, profile);

                return {
                    userId,
                    jobId: jobData.id,
                    status: "new" as const,
                    // decimal(4,3) column — clamp to [0, 1] to guard against
                    // floating-point drift from pgvector cosine distance
                    relevanceScore: Math.min(1, Math.max(0, scoreObj.score)).toFixed(3),
                    matchReasons: reasonsArray,
                    preferencesHash: prefHash,
                };
            });

            await JobsService.saveJobs([], userJobsInsertions);
        });

        return { message: "Job search and scoring completed." };
    }
);
