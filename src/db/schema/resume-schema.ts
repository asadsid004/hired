import { integer, jsonb, pgTable, text, timestamp, vector } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { jobs } from "./jobs-schema";

import { ResumeAnalysis, ResumeProfile } from "@/lib/ai/schemas/resume.schema";

export const resume = pgTable("resume", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
    fileName: text("file_name").notNull(),
    key: text("key").notNull(),
    text: text("text").notNull(),
    links: text("links").array(),
    data: jsonb("data").$type<ResumeProfile>(),
    analysis: jsonb("analysis").$type<ResumeAnalysis>(),
    embedding: vector('embedding', { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export type Resume = typeof resume.$inferSelect;
export type ResumeInsert = typeof resume.$inferInsert;