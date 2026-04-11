import { OnboardingStartedEvent } from "./functions/onboarding/onboarding";
import { JobSearchEvent } from "./functions/jobs/search";
import { InterviewEvaluateEvent } from "./functions/interview/evaluate";

export type Events = {
    "hired/onboarding.started": OnboardingStartedEvent;
    "hired/jobs.search": JobSearchEvent;
    "hired/interview.evaluate": InterviewEvaluateEvent;
};

