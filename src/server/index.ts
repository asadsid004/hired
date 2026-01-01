import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { onboardingRoutes } from "./modules/onboarding/onboarding.route";

export const app = new Elysia({ prefix: '/api' })
    .mount(auth.handler)
    .use(onboardingRoutes)

export type App = typeof app