import * as onboardingFunctions from "./functions/onboarding";
import * as jobsFunctions from "./functions/jobs";
import * as interviewFunctions from "./functions/interview";

export const allFunctions = [
    ...Object.values(onboardingFunctions),
    ...Object.values(jobsFunctions),
    ...Object.values(interviewFunctions),
];

