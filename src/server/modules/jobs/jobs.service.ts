import { db } from "@/db/drizzle";
import { Job, jobs, userJobs, NewJob, NewUserJob } from "@/db/schema/jobs-schema";
import { JobPreference } from "@/db/schema/preferences-schema";
import { ResumeProfile } from "@/lib/ai/schemas/resume.schema";
import { createHash } from "crypto";
import { TheirStackJob, TheirStackJobResponse } from "./jobs.types";
import { embedMany } from "ai";
import { getEmbeddingModel } from "@/lib/ai";
import { sql } from "drizzle-orm";

export const JobsService = {
    async getJobLocationId(
        locations: string[],
    ): Promise<{ [key: string]: number }> {
        const ids: { [key: string]: number } = {};
        for (const location of locations) {
            const res = await fetch(
                "https://api.theirstack.com/v0/catalog/locations?name=" + location,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${process.env.THEIRSTACK_API_KEY}`,
                    },
                },
            );
            const data = await res.json();
            if (data) {
                ids[location] = data[0].id;
            }
        }
        return ids;
    },
    async getJobSeniority(experience: ResumeProfile["experience"]) {
        let years = 0;

        if (experience && experience.length > 0) {
            years = experience.reduce((total, exp) => {
                if (!exp.startDate) return total;
                const start = new Date(exp.startDate);
                const end = exp.isCurrent || !exp.endDate ? new Date() : new Date(exp.endDate);

                const diffMs = end.getTime() - start.getTime();
                const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);

                return total + (diffYears > 0 ? diffYears : 0);
            }, 0);
        }

        if (years < 1) {
            return "junior";
        } else if (years < 4) {
            return "mid_level";
        } else {
            return "senior";
        }
    },
    async getJobs(preferences: JobPreference, experience: ResumeProfile["experience"]) {
        const seniority = await this.getJobSeniority(experience);
        const locationIds = await this.getJobLocationId(preferences.location);

        const jobIds = await db.select().from(jobs).then((res) => res.map((job) => job.id));

        const locationArray = Object.values(locationIds).map(id => ({ id }));
        const body = JSON.stringify({
            "job_title_or": preferences.role,
            "employment_statuses_or": [preferences.type.replace("-", "_")],
            "remote": ["remote", "hybrid"].includes(preferences.mode),
            "job_location_or": locationArray,
            "posted_at_max_age_days": 15,
            "job_seniority_or": [seniority],
            ...(jobIds.length > 0 && { "job_id_not": jobIds })
        });

        console.log(body);

        const Jobs: TheirStackJobResponse = await fetch("https://api.theirstack.com/v1/jobs/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.THEIRSTACK_API_KEY}`,
            },
            body,
        }).then((res) => res.json());

        return Jobs;
    },
    generatePreferenceHash(preferences: JobPreference) {
        return createHash("sha256")
            .update(JSON.stringify(preferences))
            .digest("hex");
    },
    getRuleBasedMatchReasons(
        job: Job,
        preferences: JobPreference,
        profile: ResumeProfile,
    ): string[] {
        const reasons: string[] = [];

        // 1. Work Mode Matching
        if (job.remote && preferences.mode === "remote") {
            reasons.push("Remote work aligns perfectly with your preferences");
        } else if (job.hybrid && preferences.mode === "hybrid") {
            reasons.push("Hybrid work aligns with your preferences");
        } else if (!job.remote && !job.hybrid && preferences.mode === "on-site") {
            reasons.push("On-site work aligns with your preferences");
        } else if (job.remote) {
            reasons.push("This role offers remote work");
        }

        // 2. Job Type / Employment Status
        const requestedType = preferences.type.replace("-", "").toLowerCase();
        if (job.employmentStatuses && job.employmentStatuses.length > 0) {
            const matchesCategory = job.employmentStatuses.some(
                (status) => status.toLowerCase().replace(/_/g, "") === requestedType,
            );
            if (matchesCategory) {
                reasons.push(`Matches your preference for ${preferences.type} roles`);
            }
        }

        // 3. Location Matching
        const prefLocationsLower = preferences.location.map((l) => l.toLowerCase());
        if (
            job.countryCode &&
            prefLocationsLower.includes(job.countryCode.toLowerCase())
        ) {
            reasons.push(`Located in your preferred country (${job.countryCode})`);
        } else if (
            job.location &&
            prefLocationsLower.some((l) => job.location!.toLowerCase().includes(l))
        ) {
            reasons.push(`Located in one of your preferred regions`);
        }

        // 4. Skills & Technologies Matching
        if (profile && profile.skills) {
            const userSkills = [
                ...(profile.skills.languages || []),
                ...(profile.skills.frameworks || []),
                ...(profile.skills.mlAndAi || []),
                ...(profile.skills.devops || []),
                ...(profile.skills.databases || []),
                ...(profile.skills.tools || []),
                ...(profile.skills.other || []),
            ].map((s) => s.toLowerCase());

            let matchedSkills: string[] = [];

            if (job.technologySlugs && job.technologySlugs.length > 0) {
                matchedSkills = job.technologySlugs.filter((slug) =>
                    userSkills.includes(slug.toLowerCase()),
                );
            } else {
                const descLower = job.description.toLowerCase();
                matchedSkills = userSkills.filter((skill) => {
                    const regex = new RegExp(
                        `\\b${skill.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, "\\\\$&")}\\b`,
                        "i",
                    );
                    return regex.test(descLower);
                });
            }

            matchedSkills = [...new Set(matchedSkills)];

            if (matchedSkills.length > 0) {
                const displaySkills = matchedSkills
                    .slice(0, 5)
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
                reasons.push(`Matches your skills in ${displaySkills.join(", ")}`);
            }
        }

        return reasons;
    },
    prepareJobForEmbedding(job: TheirStackJob): string {
        const parts: string[] = [];
        parts.push(`Title: ${job.job_title}`);
        parts.push(`Company: ${job.company}`);
        if (job.description) parts.push(`Description:\n${job.description}`);
        if (job.technology_slugs?.length) parts.push(`Technologies: ${job.technology_slugs.join(", ")}`);
        return parts.join("\n\n");
    },
    async generateJobEmbeddings(texts: string[]): Promise<number[][]> {
        if (texts.length === 0) return [];
        const { embeddings } = await embedMany({
            model: getEmbeddingModel().model,
            values: texts,
            providerOptions: getEmbeddingModel().providerOptions,
        });
        return embeddings;
    },
    async computeSimilarityInDb(userId: string, fetchedJobIds: number[]): Promise<Array<{ jobId: number, score: number }>> {
        if (fetchedJobIds.length === 0) return [];

        const result = await db.execute(sql`
            SELECT 
                j.id as "jobId",
                1 - (j.embedding <=> u.profile_embedding) as score
            FROM ${jobs} j
            JOIN "user" u ON u.id = ${userId}
            WHERE j.id IN ${sql`(${sql.join(fetchedJobIds, sql`, `)})`}
        `);

        return result.rows.map((row) => ({
            jobId: Number(row.jobId),
            score: Number(row.score)
        }));
    },
    async saveJobs(
        newJobs: NewJob[],
        userJobsData: NewUserJob[]
    ) {
        if (newJobs.length > 0) {
            await db.insert(jobs).values(newJobs).onConflictDoNothing({ target: jobs.id });
        }
        if (userJobsData.length > 0) {
            await db.insert(userJobs).values(userJobsData).onConflictDoNothing({ target: [userJobs.userId, userJobs.jobId] });
        }
    }
};
