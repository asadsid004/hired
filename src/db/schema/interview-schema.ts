import { pgTable, uuid, text, jsonb, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { jobs } from "./jobs-schema";
import { relations } from "drizzle-orm";

export const interviewStatus = pgEnum("interview_status", [
    "in_progress",
    "processing",
    "completed",
    "failed",
]);

export const interviews = pgTable("interviews", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),

    jobId: integer("job_id")
        .references(() => jobs.id, { onDelete: "cascade" }),
    jobRole: text("job_role"),
    jobDescription: text("job_description"),

    interviewType: text("interview_type"), // mixed|technical|behavioral
    difficulty: text("difficulty"), // easy|medium|hard
    durationMinutes: integer("duration_minutes").notNull(),// 15|30|45|60

    vapiCallId: text("vapi_call_id").unique(),
    status: interviewStatus("status").notNull().default("in_progress"),

    score: integer("score"),
    transcript: text("transcript"),          // plain text transcript
    messages: jsonb("messages"),                 // structured messages JSON
    report: jsonb("report"),                 // structured report JSON
    vapiEndedReason: text("vapi_ended_reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const interviewRelations = relations(interviews, ({ one }) => ({
    user: one(user, {
        fields: [interviews.userId],
        references: [user.id],
    }),
    job: one(jobs, {
        fields: [interviews.jobId],
        references: [jobs.id],
    }),
}));

export type Interview = typeof interviews.$inferSelect;
