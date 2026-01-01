import { Elysia } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { onboardingController } from './onboarding.controller';
import { onboardingSchema } from './onboarding.schema';

export const onboardingRoutes = new Elysia({ prefix: '/onboarding' })
    .use(authMiddleware)
    .post('/', async ({ body, user }) => {
        await onboardingController.submit({ body, user });
    }, {
        body: onboardingSchema,
        auth: true
    });