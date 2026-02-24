import * as onboardingFunctions from "./functions/onboarding";
import * as jobsFunctions from "./functions/jobs";

export const allFunctions = [
    ...Object.values(onboardingFunctions),
    ...Object.values(jobsFunctions),
];

