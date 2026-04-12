import { Elysia, t } from "elysia";
import { authMiddleware } from "@/server/middleware/auth";
import { InterviewService } from "./interview.service";

export const interviewRoutes = new Elysia({ prefix: "/interview" })
  .use(authMiddleware)
  .post(
    "/sessions",
    async ({ body, user }) => {
      const interview = await InterviewService.createInterview(
        user.id,
        body.jobId,
        body.jobRole,
        body.jobDescription,
        body.interviewType,
        body.difficulty,
        body.durationMinutes
      );

      return { interviewId: interview.id };
    },
    {
      auth: true,
      body: t.Object({
        jobId: t.Optional(t.Number()),
        jobRole: t.String({ minLength: 1 }),
        jobDescription: t.String({ minLength: 1 }),
        interviewType: t.String({ default: "technical" }),
        difficulty: t.String({ default: "medium" }),
        durationMinutes: t.Number({ default: 15 }),
      }),
    }
  )
  .get(
    "/sessions",
    async ({ user }) => {
      const sessions = await InterviewService.getAllInterviews(user.id);
      return sessions;
    },
    { auth: true }
  )
  .get(
    "/sessions/:id",
    async ({ params, user }) => {
      const session = await InterviewService.getInterview(params.id, user.id);
      return session;
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
    }
  )
  .patch(
    "/sessions/:id/status",
    async ({ params, body, user }) => {
      await InterviewService.updateInterviewStatus(params.id, user.id, body.status);
      return { success: true };
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Object({ status: t.Enum({ processing: "processing", in_progress: "in_progress", completed: "completed", failed: "failed" }) }),
    }
  )
  // ── VAPI webhook – public, no auth
  .post(
    "/webhook",
    async ({ body }) => {
      await InterviewService.handleVapiWebhook(body);
      return { success: true };
    },
    {
      body: t.Any(),
    }
  );
