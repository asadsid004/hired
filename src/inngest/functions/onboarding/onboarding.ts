import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
    jobPreferences as JobPreferences,
    resume as Resume,
    user,
} from "@/db/schema";

import { inngest } from "@/inngest/client";
import { getPresignedUrl } from "@/lib/s3";
import { resumeService } from "@/server/modules/resume/resume.service";

export type OnboardingStartedEvent = {
    name: "hired/onboarding.started";
    data: {
        resumeId: string;
    };
};

export const processOnboarding = inngest.createFunction(
    { id: "process-onboarding" },
    { event: "hired/onboarding.started" },
    async ({ event, step }) => {
        const { resumeId } = event.data;

        const { resume, jobPreferences } = await step.run("get-resume-and-job-preferences", async () => {
            const resume = await db.query.resume.findFirst({
                where: eq(Resume.id, resumeId),
            });
            if (!resume) {
                throw new Error("Resume not found");
            }

            const jobPreferences = await db.query.jobPreferences.findFirst({
                where: eq(JobPreferences.userId, resume.userId),
            });
            if (!jobPreferences) {
                throw new Error("Job preferences not found");
            }

            return { resume, jobPreferences };
        },
        );

        const structuredOutput = step.run("structured-output", async () => {
            return await resumeService.structuredOutput(
                resume.text,
                resume.links ?? [],
            );
        });

        const atsAnalysis = step.run("ats-analysis", async () => {
            const fileUrl = await getPresignedUrl(resume.key);

            const fileBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());

            return await resumeService.atsAnalysis(fileBuffer);
        });

        const sectionAnalysis = step.run("section-analysis", async () => {
            return await resumeService.sectionAnalysis(resume.text);
        });

        const semanticAnalysis = step.run("semantic-analysis", async () => {
            return await resumeService.semanticAnalysis(resume.text, jobPreferences);
        });

        const [output, ats, section, semantic] = await Promise.all([
            structuredOutput,
            atsAnalysis,
            sectionAnalysis,
            semanticAnalysis,
        ]);

        await step.run("update-user-profile-and-resume", async () => {
            const overall =
                ats.score * 0.4 + section.score * 0.3 + semantic.score * 0.3;

            await db
                .update(user)
                .set({ profile: output })
                .where(eq(user.id, resume.userId));

            return await resumeService.updateResume(resumeId, {
                data: output,
                analysis: {
                    overall,
                    ats: ats,
                    section: section,
                    semantic: semantic,
                },
            });
        });
    },
);
