import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
    jobPreferences as JobPreferences,
    resume as Resume,
    user,
} from "@/db/schema";

import { inngest } from "@/inngest/client";
import { resumeService } from "@/server/modules/resume/resume.service";
import { searchJobs } from "../jobs";

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

        const { resume } = await step.run("get-resume-and-job-preferences", async () => {
            const resumeData = await db.query.resume.findFirst({
                where: eq(Resume.id, resumeId),
            });
            if (!resumeData) {
                throw new Error("Resume not found");
            }
            const prefs = await db.query.jobPreferences.findFirst({
                where: eq(JobPreferences.userId, resumeData.userId),
            });
            if (!prefs) {
                throw new Error("Job preferences not found");
            }
            return {
                resume: resumeData,
                jobPreferences: prefs,
            };
        });

        await step.run("update-status-start", async () => {
            await db.update(user).set({
                onboardingStatus: 'extracting',
            }).where(eq(user.id, resume.userId));
        });

        await step.run("update-status-analyzing", async () => {
            await db.update(user).set({
                onboardingStatus: 'analyzing',
            }).where(eq(user.id, resume.userId));
        });

        const structuredOutput = step.run("structured-output", async () => {
            return await resumeService.structuredOutput(
                resume.text,
                resume.links ?? [],
            );
        });

        // const atsAnalysis = step.run("ats-analysis", async () => {
        //     const fileUrl = await getPresignedUrl(resume.key);

        //     const fileBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());

        //     return await resumeService.atsAnalysis(fileBuffer);
        // });

        // const sectionAnalysis = step.run("section-analysis", async () => {
        //     return await resumeService.sectionAnalysis(resume.text);
        // });

        // const semanticAnalysis = step.run("semantic-analysis", async () => {
        //     return await resumeService.semanticAnalysis(resume.text, jobPreferences);
        // });

        // const [output, ats, section, semantic] = await Promise.all([
        //     structuredOutput,
        //     atsAnalysis,
        //     sectionAnalysis,
        //     semanticAnalysis,
        // ]);
        const output = await structuredOutput;


        // await step.run("update-user-profile-and-resume", async () => {
        //     const overall =
        //         ats.score * 0.4 + section.score * 0.3 + semantic.score * 0.3;

        //     await db
        //         .update(user)
        //         .set({ profile: output })
        //         .where(eq(user.id, resume.userId));

        //     return await resumeService.updateResume(resumeId, {
        //         data: output,
        //         analysis: {
        //             overall,
        //             ats: ats,
        //             section: section,
        //             semantic: semantic,
        //         },
        //     });
        // });

        await step.run("update-user-profile-and-resume", async () => {
            await db
                .update(user)
                .set({ profile: output })
                .where(eq(user.id, resume.userId));

            return await resumeService.updateResume(resumeId, {
                data: output
            });
        });

        await step.run("generate-embedding", async () => {
            const embeddingText = resumeService.prepareResumeForEmbedding(output);

            const embedding = await resumeService.generateEmbedding(embeddingText);

            await db.transaction(async (tx) => {
                await tx
                    .update(user)
                    .set({ profileEmbedding: embedding })
                    .where(eq(user.id, resume.userId));

                await tx
                    .update(Resume)
                    .set({ embedding: embedding })
                    .where(eq(Resume.id, resumeId));
            });
        });

        await step.run("update-status-searching", async () => {
            await db.update(user).set({
                onboardingStatus: 'searching',
            }).where(eq(user.id, resume.userId));
        });

        await step.invoke("job-search", {
            function: searchJobs,
            data: {
                userId: resume.userId,
            },
        });

        await step.run("update-status-matching", async () => {
            await db.update(user).set({
                onboardingStatus: 'matching',
            }).where(eq(user.id, resume.userId));
        });

        await step.run("update-status-finished", async () => {
            await db.update(user).set({
                onboardingCompleted: true,
                onboardingStatus: 'finished',
            }).where(eq(user.id, resume.userId));
        });
    },
);
