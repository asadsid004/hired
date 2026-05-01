import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { onboardingRoutes } from "./modules/onboarding/onboarding.route";
import { jobsRoutes } from "./modules/jobs/jobs.route";
import { resumeRoutes } from "./modules/resume/resume.route";
import { profileRoutes } from "./modules/profile/profile.route";
import { practiceRoutes } from "./modules/practice/practice.route";
import { interviewRoutes } from "./modules/interview/interview.route";
import { dashboardRoutes } from "./modules/dashboard/dashboard.route";

export const app = new Elysia({ prefix: '/api' })
    .mount(auth.handler)
    .use(onboardingRoutes)
    .use(jobsRoutes)
    .use(resumeRoutes)
    .use(profileRoutes)
    .use(practiceRoutes)
    .use(interviewRoutes)
    .use(dashboardRoutes)

export type App = typeof app