import { Elysia, t } from "elysia";
import { authMiddleware } from "@/server/middleware/auth";
import { db } from "@/db/drizzle";
import { interviewSessions, interviewQuestions } from "@/db/schema/interview-schema";
import { eq } from "drizzle-orm";
import { InterviewService } from "./interview.service";

export const interviewRoutes = new Elysia({ prefix: "/interview" })
  .use(authMiddleware)
  .post(
    "/sessions",
    async ({ body, user }) => {
      const sessionId = await InterviewService.createSession(
        user.id,
        body.topics,
        body.difficulty,
        body.durationMinutes,
        body.questionCount
      );

      return { sessionId };
    },
    {
      auth: true,
      body: t.Object({
        topics: t.Array(t.String()),
        difficulty: t.String(),
        durationMinutes: t.Number(),
        questionCount: t.Number(),
      }),
    }
  )
  .get(
    "/sessions",
    async ({ user }) => {
      const sessions = await db.query.interviewSessions.findMany({
        where: eq(interviewSessions.userId, user.id),
        with: {
          questions: true,
        },
        orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      });

      return sessions;
    },
    {
      auth: true,
    }
  )
  .get(
    "/sessions/:id",
    async ({ params, user }) => {
      const session = await db.query.interviewSessions.findFirst({
        where: eq(interviewSessions.id, params.id),
        with: {
          questions: true,
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      if (session.userId !== user.id) {
        throw new Error("Unauthorized");
      }

      return session;
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/sessions/:id/submit",
    async ({ params, body, user }) => {
      const session = await db.query.interviewSessions.findFirst({
        where: eq(interviewSessions.id, params.id),
      });

      if (!session || session.userId !== user.id) {
        throw new Error("Unauthorized or not found");
      }

      // Save user answers
      await db.transaction(async (tx) => {
        for (const answer of body.answers) {
          await tx
            .update(interviewQuestions)
            .set({ userAnswer: answer.userAnswer })
            .where(eq(interviewQuestions.id, answer.questionId));
        }

        await tx
          .update(interviewSessions)
          .set({ 
            status: "evaluating",
            completedAt: new Date()
           })
          .where(eq(interviewSessions.id, params.id));
      });

      // Trigger background job
      await InterviewService.triggerEvaluation(params.id);

      return { success: true };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        answers: t.Array(
          t.Object({
            questionId: t.String(),
            userAnswer: t.String(),
          })
        ),
      }),
    }
  );
