import { inngest } from "@/inngest/client";
import { db } from "@/db/drizzle";
import { interviewSessions, interviewQuestions } from "@/db/schema/interview-schema";
import { eq } from "drizzle-orm";
import { getModel } from "@/lib/ai";
import { generateText, Output } from "ai";
import { z } from "zod";

export type InterviewEvaluateEvent = {
    data: {
        sessionId: string;
    };
};

export const evaluateInterview = inngest.createFunction(
    { id: "evaluate-interview", name: "Evaluate Interview" },
    { event: "hired/interview.evaluate" },
    async ({ event, step }) => {
        const { sessionId } = event.data;

        const session = await step.run("fetch-session", async () => {
            return await db.query.interviewSessions.findFirst({
                where: eq(interviewSessions.id, sessionId),
                with: {
                    questions: true,
                },
            });
        });

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const { evaluationResults, overallFeedback } = await step.run("evaluate-answers-ai", async () => {
            const prompt = `You are a professional technical interviewer.
Evaluate the candidate's performance for the following questions.

${session.questions
                    .map(
                        (q, i) => `
Question ${i + 1} (Ref ID: ${q.id})
Question: ${q.questionText}
Candidate's Answer: ${q.userAnswer || "NO ANSWER PROVIDED"}
`
                    )
                    .join("\n\n")}

For each question:
1. If an answer was provided, evaluate if it is fundamentally correct.
2. If no answer was provided, mark isCorrect as false.
3. Provide constructive feedback on the candidate's performance.
4. ALWAYS provide a "Model Answer" (the ideal response).

Finally, provide an overall session feedback.
- Summarize strengths and weaknesses.
- Provide a "Roadmap for Improvement" with specific concepts to master.
- For resources, provide suggested Google Search queries for each concept (e.g. "Search: MDN Javascript Closures").

CRITICAL UI RULES:
- DO NOT use Markdown (no bold **, no italic *, no headers #). 
- Only use plain text.
- IMPORTANT: Make sure to use multiple newlines (\\n\\n) to separate sections and points for both individual question evaluations and overall session feedback.`;

            const { output } = await generateText({
                model: getModel("standard_2"),
                system: "You are an expert interviewer. Return individual question evaluations and an overall session summary. STRICTLY NO MARKDOWN.",
                prompt,
                output: Output.object({
                    schema: z.object({
                        evaluations: z.array(
                            z.object({
                                id: z.string().describe("The Ref ID of the question"),
                                isCorrect: z.boolean(),
                                feedback: z.string().describe("Plain text feedback (no markdown)"),
                                modelAnswer: z.string().describe("Plain text ideal answer (no markdown)"),
                            })
                        ),
                        overallFeedback: z.string().describe("Plain text session summary, roadmap, and search-based resources (no markdown)"),
                    }),
                }),
            });

            return {
                evaluationResults: output.evaluations.map((result) => ({
                    id: result.id,
                    isCorrect: result.isCorrect,
                    feedback: `${result.feedback}\n\nModel Answer:\n${result.modelAnswer}`,
                })),
                overallFeedback: output.overallFeedback,
            };
        });

        await step.run("save-evaluations", async () => {
            await db.transaction(async (tx) => {
                for (const result of evaluationResults) {
                    await tx.update(interviewQuestions)
                        .set({
                            isCorrect: result.isCorrect,
                            feedback: result.feedback,
                        })
                        .where(eq(interviewQuestions.id, result.id));
                }

                await tx.update(interviewSessions)
                    .set({
                        status: "completed",
                        overallFeedback: overallFeedback
                    })
                    .where(eq(interviewSessions.id, sessionId));
            });
        });

        return { success: true, evaluatedAnswersCount: evaluationResults.length };
    }
);
