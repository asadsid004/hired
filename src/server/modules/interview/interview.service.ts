import { db } from "@/db/drizzle";
import { interviews } from "@/db/schema/interview-schema";
import { getModel } from "@/lib/ai";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/ai/prompts/system/interview.system.prompt";
import { INTERVIEW_TASK_PROMPT } from "@/lib/ai/prompts/tasks/interview.task.prompt";
import { generateText, Output } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";

type VapiMessage = {
  role: "user" | "assistant" | "system" | "tool";
  message: string;
  time: number;
  endTime?: number;
  duration?: number;
  secondsFromStart: number;
};

const InterviewReportSchema = z.object({
  overallScore: z.number().describe("Overall score out of 100"),
  communicationScore: z.number().describe("Communication score out of 100"),
  technicalScore: z.number().describe("Technical score out of 100"),
  strengths: z.array(z.string()).describe("Strengths of the candidate"),
  weaknesses: z.array(z.string()).describe("Weaknesses of the candidate"),
  areasToImprove: z.array(z.string()).describe("Areas to improve"),
  summary: z.string().describe("Summary of the interview"),
});

async function generateReport(
  jobRole: string,
  jobDescription: string,
  interviewType: string,
  difficulty: string,
  transcript: string
): Promise<z.infer<typeof InterviewReportSchema>> {
  try {
    const { output } = await generateText({
      model: getModel("standard"),
      system: INTERVIEW_SYSTEM_PROMPT,
      prompt: INTERVIEW_TASK_PROMPT(jobRole, jobDescription, interviewType, difficulty, transcript),
      output: Output.object({
        schema: InterviewReportSchema,
      })
    });

    return output;
  } catch {
    return {
      overallScore: 0,
      communicationScore: 0,
      technicalScore: 0,
      strengths: [],
      weaknesses: [],
      areasToImprove: [],
      summary: "Report could not be generated automatically.",
    };
  }
}

export const InterviewService = {
  async createInterview(
    userId: string,
    jobId: number | undefined,
    jobRole: string,
    jobDescription: string,
    interviewType: string,
    difficulty: string,
    durationMinutes: number
  ) {
    const [interview] = await db
      .insert(interviews)
      .values({
        userId,
        jobId,
        jobRole,
        jobDescription,
        interviewType: interviewType ?? "technical",
        difficulty: difficulty ?? "medium",
        status: "in_progress",
        durationMinutes,
      })
      .returning();

    return interview;
  },

  async getAllInterviews(userId: string) {
    return db.query.interviews.findMany({
      where: eq(interviews.userId, userId),
      orderBy: (tbl, { desc }) => [desc(tbl.createdAt)],
      with: {
        job: true,
      },
    });
  },

  async getInterview(id: string, userId: string) {
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, id),
    });

    if (!interview || interview.userId !== userId) {
      throw new Error("Interview not found or unauthorized");
    }

    return interview;
  },

  async updateInterviewStatus(id: string, userId: string, status: "processing" | "in_progress" | "completed" | "failed") {
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, id),
    });

    if (!interview || interview.userId !== userId) {
      throw new Error("Interview not found or unauthorized");
    }

    await db
      .update(interviews)
      .set({ status })
      .where(eq(interviews.id, id));

    return { success: true };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleVapiWebhook(payload: any) {
    console.log("[VAPI Webhook] Payload:", JSON.stringify(payload, null, 2));
    const msg = payload?.message;
    if (!msg || msg.type !== "end-of-call-report") return;

    const call = msg.call;
    const rawTranscript: string = msg.transcript ?? "";
    const rawMessages: VapiMessage[] = msg.messages ?? [];
    const endedReason: string = msg.endedReason ?? "";
    const interviewId: string | undefined =
      call?.assistant?.metadata?.interviewId ??
      call?.assistantOverrides?.metadata?.interviewId;

    if (!interviewId) {
      console.warn("[VAPI Webhook] No interviewId found in call metadata");
      return;
    }

    // Determine final status
    const failed =
      endedReason === "error" ||
      endedReason === "assistant-error" ||
      endedReason === "pipeline-error";
    const status = failed ? "failed" : "completed";

    // Fetch interview to get job details for report generation
    const interview = await db.query.interviews.findFirst({
      where: eq(interviews.id, interviewId),
    });

    if (!interview) {
      console.warn("[VAPI Webhook] No interview found for ID:", interviewId);
      return;
    }

    const report =
      !failed && rawTranscript.length > 50
        ? await generateReport(
          interview.jobRole!,
          interview.jobDescription!,
          interview.interviewType!,
          interview.difficulty!,
          rawTranscript
        )
        : null;

    await db
      .update(interviews)
      .set({
        vapiCallId: call.id,
        score: report?.overallScore,
        transcript: rawTranscript,
        messages: rawMessages,
        report,
        vapiEndedReason: endedReason,
        status,
        endedAt: new Date(),
      })
      .where(eq(interviews.id, interviewId));
  },
};
