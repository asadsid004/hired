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
