import { inngest } from "@/inngest/client";
import { db } from "@/db/drizzle";
import { Job } from "@/db/schema/jobs-schema";
import { JobsService } from "@/server/modules/jobs/jobs.service";
import { user, jobPreferences as JobPreferences, JobPreference } from "@/db/schema";
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

            const jobsInsertions = newJobsToSave.map(job => ({
                id: job.id,
                jobTitle: job.job_title,
                normalizedTitle: job.normalized_title,
                description: job.description,
                url: job.url,
                company: job.company,
                companyDomain: job.company_domain,
                companyLogo: job.company_object?.logo,
                companyIndustry: job.company_object?.industry,
                companyEmployeeCount: job.company_object?.employee_count,
                companyCountryCode: job.company_object?.country_code,
                companyDescription: job.company_object?.seo_description,
                companyLinkedinUrl: job.company_object?.linkedin_url,
                companyFoundedYear: job.company_object?.founded_year,
                companyTechnologySlugs: job.company_object?.technology_slugs,
                location: job.location,
                shortLocation: job.short_location,
                stateCode: job.state_code,
                countryCode: job.country_code,
                remote: job.remote,
                hybrid: job.hybrid,
                latitude: job.latitude ? job.latitude.toString() : null,
                longitude: job.longitude ? job.longitude.toString() : null,
                salaryString: job.salary_string,
                minAnnualSalaryUsd: job.min_annual_salary_usd,
                maxAnnualSalaryUsd: job.max_annual_salary_usd,
                avgAnnualSalaryUsd: job.avg_annual_salary_usd,
                seniority: job.seniority,
                employmentStatuses: job.employment_statuses,
                technologySlugs: job.technology_slugs,
                datePosted: job.date_posted ? new Date(job.date_posted) : new Date(),
                embedding: embeddingsMap[job.id] || null
            }));

            await JobsService.saveJobs(jobsInsertions, []);
        });

        // 6. Compute Similarities using PG Vector
        const jobScores = await step.run("compute-similarities", async () => {
            const allJobIds = validJobs.map(j => j.id);
            return await JobsService.computeSimilarityInDb(userId, allJobIds);
        });

        // 7. Generate top matches and save UserJob connections
        await step.run("save-user-jobs-with-reasoning", async () => {
            // Sort by score
            const sortedScoredJobs = [...jobScores].sort((a, b) => b.score - a.score);

            const prefHash = JobsService.generatePreferenceHash({ ...preferences, createdAt: new Date(preferences.createdAt), updatedAt: new Date(preferences.updatedAt) });

            const userJobsInsertions = sortedScoredJobs.map((scoreObj) => {
                const jobData = validJobs.find(j => j.id === scoreObj.jobId)!;
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
                const reasonsArray = JobsService.getRuleBasedMatchReasons(mappedJobData as unknown as Job, preferences as unknown as JobPreference, profile);

                return {
                    userId,
                    jobId: jobData.id,
                    status: "new" as const,
                    relevanceScore: scoreObj.score.toString(),
                    matchReasons: reasonsArray,
                    preferencesHash: prefHash
                };
            });

            await JobsService.saveJobs([], userJobsInsertions);
        });

        return { message: "Job search and scoring completed." };
    }
);
