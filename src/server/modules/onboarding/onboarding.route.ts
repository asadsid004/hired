import { Elysia } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { onboardingController } from './onboarding.controller';
import { onboardingSchema } from './onboarding.schema';
import { db } from '@/db/drizzle';
import { resume, user as users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/inngest/client';

export const onboardingRoutes = new Elysia({ prefix: '/onboarding' })
    .use(authMiddleware)
    .post('/', async ({ body, user }) => {
        await onboardingController.submit({ body, user });

        const Resume = await db.query.resume.findFirst({
            where: eq(resume.userId, user.id),
        })

        await inngest.send({
            name: "hired/onboarding.started",
            data: {
                resumeId: Resume!.id,
            }
        })
    }, {
        body: onboardingSchema,
        auth: true
    })
    .get('/status', async ({ user }) => {
        const freshUser = await db.query.user.findFirst({
            where: eq(users.id, user.id),
            columns: {
                onboardingStatus: true,
            },
        });

        return freshUser?.onboardingStatus ?? null;
    }, {
        auth: true
    });