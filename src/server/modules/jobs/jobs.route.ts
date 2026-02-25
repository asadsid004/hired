import { Elysia } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { userJobs, jobs } from '@/db/schema/jobs-schema';
import { desc, eq } from 'drizzle-orm';

export const jobsRoutes = new Elysia({ prefix: '/jobs' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {
        const results = await db
            .select({
                userJob: userJobs,
                job: jobs,
            })
            .from(userJobs)
            .innerJoin(jobs, eq(userJobs.jobId, jobs.id))
            .where(eq(userJobs.userId, user.id))
            .orderBy(desc(userJobs.relevanceScore));

        // Group the data cleanly
        return results.map(row => ({
            ...row.job,
            userJobRecord: row.userJob,
        }));
    }, {
        auth: true
    });
