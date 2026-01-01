import { OnboardingData } from "./onboarding.schema";
import { db } from "@/db/drizzle";
import { jobPreferences, User, user as users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const onboardingService = {
    async submit(user: User, data: OnboardingData) {
        try {

            await db.transaction(async (tx) => {
                await tx.insert(jobPreferences).values({
                    userId: user.id,
                    role: Array.isArray(data.role) ? data.role : [data.role],
                    type: data.type,
                    mode: data.mode,
                    location: Array.isArray(data.location) ? data.location : [data.location],
                })

                // TODO: Handle resume upload and processing

                await tx.update(users).set({ onboardingCompleted: true }).where(eq(users.id, user.id));
            })

        } catch (error) {
            const err = error as Error;

            throw err.message;
        }
    }
};