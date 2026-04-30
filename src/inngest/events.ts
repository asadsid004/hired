import { OnboardingStartedEvent } from "./functions/onboarding/onboarding";
import { JobSearchEvent } from "./functions/jobs/search";
import { JobParseEvent } from "./functions/jobs/parse";
import { PracticeEvaluateEvent } from "./functions/practice/evaluate";

export type Events = {
    "hired/onboarding.started": OnboardingStartedEvent;
    "hired/jobs.search": JobSearchEvent;
    "hired/jobs.parse": JobParseEvent;
    "hired/practice.evaluate": PracticeEvaluateEvent;
};

