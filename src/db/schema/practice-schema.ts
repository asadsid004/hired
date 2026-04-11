import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, jsonb, pgEnum, integer } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const practiceStatusEnum = pgEnum("practice_status", [
  "in_progress",
  "evaluating",
  "completed",
]);

export const practiceSessions = pgTable("practice_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  topics: jsonb("topics").notNull().$type<string[]>(),
  difficulty: text("difficulty").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  status: practiceStatusEnum("status").notNull().default("in_progress"),
  overallFeedback: text("overall_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  completedAt: timestamp("completed_at"),
});

export const practiceQuestions = pgTable("practice_question", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
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

export const practiceSessionRelations = relations(practiceSessions, ({ one, many }) => ({
  user: one(user, {
    fields: [practiceSessions.userId],
    references: [user.id],
  }),
  questions: many(practiceQuestions),
}));

export const practiceQuestionRelations = relations(practiceQuestions, ({ one }) => ({
  session: one(practiceSessions, {
    fields: [practiceQuestions.sessionId],
    references: [practiceSessions.id],
  }),
}));
