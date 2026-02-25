import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { onboardingRoutes } from "./modules/onboarding/onboarding.route";
import { jobsRoutes } from "./modules/jobs/jobs.route";

export const app = new Elysia({ prefix: '/api' })
    .mount(auth.handler)
    .use(onboardingRoutes)
    .use(jobsRoutes)

export type App = typeof app