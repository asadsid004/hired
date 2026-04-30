import { inngest } from "@/inngest/client";
import { db } from "@/db/drizzle";
import { jobs, userJobs } from "@/db/schema/jobs-schema";
import { eq, and, isNull } from "drizzle-orm";
import { generateText, Output } from "ai";
import { getModel, ModelPreset } from "@/lib/ai";
import { ParsedJobDescriptionSchema } from "@/lib/ai/schemas/job-description.schema";
import { JOB_DESCRIPTION_PARSING_SYSTEM_PROMPT } from "@/lib/ai/prompts/system/job.system.prompt";
import { buildJobDescriptionParsingPrompt } from "@/lib/ai/prompts/tasks/job.task.prompt";

export type JobParseEvent = {
    name: "hired/jobs.parse";
    data: {
        userId: string;
    };
};

export const parseJobDescriptions = inngest.createFunction(
    { id: "parse-job-descriptions" },
    { event: "hired/jobs.parse" },
    async ({ event, step }) => {
        const { userId } = event.data;

        // 1. Find all unparsed jobs linked to this user
        const unparsedJobs = await step.run("find-unparsed-jobs", async () => {
            const results = await db
                .select({
                    id: jobs.id,
                    jobTitle: jobs.jobTitle,
                    company: jobs.company,
                    description: jobs.description,
                })
                .from(jobs)
                .innerJoin(userJobs, eq(jobs.id, userJobs.jobId))
                .where(
                    and(
                        eq(userJobs.userId, userId),
                        isNull(jobs.parsedDescription)
                    )
                );

            return results;
        });

        if (unparsedJobs.length === 0) {
            return { message: "No unparsed jobs to process." };
        }

        // 2. Process each job individually
        // Using separate steps ensures that if the function times out, 
        // it resumes from the exact job it failed on.
        const modelPresets: ModelPreset[] = ["standard_3", "standard_5", "standard_4", "standard_6"];

        for (let i = 0; i < unparsedJobs.length; i++) {
            const job = unparsedJobs[i];
            const preset = modelPresets[Math.floor(i / 4) % modelPresets.length];

            await step.run(`parse-job-${job.id}`, async () => {
                try {
                    const { output } = await generateText({
                        model: getModel(preset),
                        system: JOB_DESCRIPTION_PARSING_SYSTEM_PROMPT,
                        prompt: buildJobDescriptionParsingPrompt({
                            jobTitle: job.jobTitle,
                            company: job.company,
                            description: job.description,
                        }),
                        output: Output.object({
                            schema: ParsedJobDescriptionSchema,
                        }),
                    });

                    if (output) {
                        await db
                            .update(jobs)
                            .set({
                                parsedDescription: output,
                                updatedAt: new Date()
                            })
                            .where(eq(jobs.id, job.id));
                        return { success: true, jobId: job.id };
                    }
                } catch (err) {
                    console.error(`Failed to parse job ${job.id}:`, err);
                    // We return the error so Inngest marks the step as failed if we want retries,
                    // or we catch it here to continue with the next job.
                    // Given your previous logic, we'll log and continue.
                    return { success: false, jobId: job.id, error: String(err) };
                }
            });
        }

        return { message: `Attempted parsing for ${unparsedJobs.length} job descriptions.` };
    }
);
