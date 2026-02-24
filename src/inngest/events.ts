import { OnboardingStartedEvent } from "./functions/onboarding/onboarding";
import { JobSearchEvent } from "./functions/jobs/search";

export type Events = {
    "hired/onboarding.started": OnboardingStartedEvent;
    "hired/jobs.search": JobSearchEvent;
};

