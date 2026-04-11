import { db } from "@/db/drizzle";
import { practiceSessions, practiceQuestions } from "@/db/schema/practice-schema";
import { getModel } from "@/lib/ai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const PracticeService = {
  async generateQuestions(topics: string[], difficulty: string, count: number) {
    console.log("Generating questions for:", { topics, difficulty, count });
    const prompt = `You are a professional technical interviewer. 
    Generate exactly ${count} interview questions for the following topics: ${topics.join(", ")}. 
    The difficulty should be ${difficulty}.
    Make the questions specific and realistic for a job interview setting.`;

    try {
      console.log("Calling AI with preset: standard_2");
      const { output } = await generateText({
        model: getModel("standard_2"),
        system: "You are an expert interviewer. Provide questions in a clear and concise format.",
        prompt,
        output: Output.object({
          schema: z.object({
            questions: z.array(z.string().min(10)).min(count).max(count),
          }),
        })
      });

      console.log("AI response received successfully");
      return output.questions;
    } catch (error) {
      console.error("Error in generateQuestions:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  },

  async createSession(userId: string, topics: string[], difficulty: string, durationMinutes: number, count: number) {
    // Generate questions via AI
    const questionsText = await this.generateQuestions(topics, difficulty, count);

    const sessionId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(practiceSessions).values({
        id: sessionId,
        userId,
        topics,
        difficulty,
        durationMinutes,
        status: "in_progress",
      });

      const questionRecords = questionsText.map((q) => ({
        id: `${nanoid(7)}-${nanoid(7)}`,
        sessionId,
        questionText: q,
      }));

      await tx.insert(practiceQuestions).values(questionRecords);
    });

    return sessionId;
  },

  async triggerEvaluation(sessionId: string) {
    // Set status to evaluating
    await db.update(practiceSessions)
      .set({ status: "evaluating" })
      .where(eq(practiceSessions.id, sessionId))

    // trigger Inngest background job
    await inngest.send({
      name: "hired/practice.evaluate",
      data: { sessionId },
    });
  }
};
