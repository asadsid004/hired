import { Elysia } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { onboardingController } from './onboarding.controller';
import { onboardingSchema } from './onboarding.schema';
import { db } from '@/db/drizzle';
import { user as users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const onboardingRoutes = new Elysia({ prefix: '/onboarding' })
    .use(authMiddleware)
    .post('/', async ({ body, user }) => {
        await onboardingController.submit({ body, user });
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