import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, jsonb, pgEnum, integer } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const interviewStatusEnum = pgEnum("interview_status", [
  "in_progress",
  "evaluating",
  "completed",
]);

export const interviewSessions = pgTable("interview_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  topics: jsonb("topics").notNull().$type<string[]>(),
  difficulty: text("difficulty").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: interviewStatusEnum("status").notNull().default("in_progress"),
  overallFeedback: text("overall_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  completedAt: timestamp("completed_at"),
});

export const interviewQuestions = pgTable("interview_question", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  userAnswer: text("user_answer"),
  isCorrect: boolean("is_correct"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const interviewSessionRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(user, {
    fields: [interviewSessions.userId],
    references: [user.id],
  }),
  questions: many(interviewQuestions),
}));

export const interviewQuestionRelations = relations(interviewQuestions, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewQuestions.sessionId],
    references: [interviewSessions.id],
  }),
}));
