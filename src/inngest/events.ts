import { OnboardingStartedEvent } from "./functions/onboarding/onboarding";
import { JobSearchEvent } from "./functions/jobs/search";
import { PracticeEvaluateEvent } from "./functions/practice/evaluate";

export type Events = {
    "hired/onboarding.started": OnboardingStartedEvent;
    "hired/jobs.search": JobSearchEvent;
    "hired/practice.evaluate": PracticeEvaluateEvent;
};

