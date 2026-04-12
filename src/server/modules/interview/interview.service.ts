import { db } from "@/db/drizzle";
import { interviews } from "@/db/schema/interview-schema";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";
import { eq } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

type VapiMessage = {
  role: "user" | "assistant" | "system" | "tool";
  message: string;
  time: number;
  endTime?: number;
  duration?: number;
  secondsFromStart: number;
};

async function generateReport(
  jobRole: string,
  jobDescription: string,
  transcript: string
): Promise<object> {
  try {
    const { text } = await generateText({
      model: getModel("standard_2"),
      system:
        "You are an expert interview coach. Analyze the following interview transcript and return a JSON object with keys: overallScore (1-100), communicationScore (1-100), technicalScore (1-100), strengths (string[]), weaknesses (string[]), areasToImprove (string[]), summary (string). Return ONLY valid JSON, no markdown.",
      prompt: `Job Role: ${jobRole ?? "General"}\n\nJob Description: ${jobDescription ?? "General"}\n\nTranscript:\n${transcript}`,
    });

    return JSON.parse(text);
  } catch {
    return {
      overallScore: null,
      communicationScore: null,
      technicalScore: null,
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
        jobRole,
        jobDescription,
        interviewType: interviewType ?? "technical",
        difficulty: difficulty ?? "medium",
        status: "in_progress",
        durationMinutes
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

    // Generate AI report from transcript (only if there's content)
    const report =
      !failed && rawTranscript.length > 50
        ? await generateReport(interview.jobRole!, interview.jobDescription!, rawTranscript)
        : null;

    await db
      .update(interviews)
      .set({
        vapiCallId: call.id,
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
