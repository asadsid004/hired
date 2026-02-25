import { Elysia, t } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { userJobs, jobs } from '@/db/schema/jobs-schema';
import { desc, eq, and, getTableColumns } from 'drizzle-orm';

// 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { embedding, ...jobColumnsWithoutEmbedding } = getTableColumns(jobs);

export const jobsRoutes = new Elysia({ prefix: '/jobs' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {
        const results = await db
            .select({
                userJob: userJobs,
                job: {
                    id: jobs.id,
                    jobTitle: jobs.jobTitle,
                    company: jobs.company,
                    companyLogo: jobs.companyLogo,
                    companyIndustry: jobs.companyIndustry,
                    location: jobs.location,
                    url: jobs.url,
                    remote: jobs.remote,
                    hybrid: jobs.hybrid,
                    datePosted: jobs.datePosted,
                    salaryString: jobs.salaryString,
                    minAnnualSalaryUsd: jobs.minAnnualSalaryUsd,
                    maxAnnualSalaryUsd: jobs.maxAnnualSalaryUsd,
                    seniority: jobs.seniority,
                    employmentStatuses: jobs.employmentStatuses,
                },
            })
            .from(userJobs)
            .innerJoin(jobs, eq(userJobs.jobId, jobs.id))
            .where(eq(userJobs.userId, user.id))
            .orderBy(desc(userJobs.relevanceScore));

        return results.map(row => ({
            ...row.job,
            userJobRecord: row.userJob,
        }));
    }, {
        auth: true
    })
    .get('/:id', async ({ params, user }) => {
        const results = await db
            .select({
                userJob: userJobs,
                job: jobColumnsWithoutEmbedding,
            })
            .from(userJobs)
            .innerJoin(jobs, eq(userJobs.jobId, jobs.id))
            .where(
                and(
                    eq(userJobs.jobId, parseInt(params.id)),
                    eq(userJobs.userId, user.id)
                )
            );

        if (results.length === 0) {
            throw new Error("Job not found");
        }

        const row = results[0];
        return {
            ...row.job,
            userJobRecord: row.userJob,
        };
    }, {
        auth: true,
        params: t.Object({
            id: t.String()
        })
    })
    .patch('/:id/status', async ({ params, body: { status }, user }) => {
        const updated = await db
            .update(userJobs)
            .set({ status })
            .where(
                and(
                    eq(userJobs.jobId, parseInt(params.id)),
                    eq(userJobs.userId, user.id)
                )
            )
            .returning();

        return updated[0];
    }, {
        auth: true,
        body: t.Object({
            status: t.Union([
                t.Literal('new'),
                t.Literal('viewed'),
                t.Literal('saved'),
                t.Literal('applied'),
                t.Literal('hidden'),
                t.Literal('rejected'),
            ])
        }),
        params: t.Object({
            id: t.String()
        })
    });
