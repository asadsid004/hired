import { User } from "@/db/schema";
import type { OnboardingData } from "./onboarding.schema";
import { onboardingService } from "./onboarding.service";

export const onboardingController = {
    submit: async ({ body, user }: {
        body: OnboardingData; user: User
    }) => {
        await onboardingService.submit(user, body);
    }
};
