import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const jobTypeEnum = pgEnum("job_type", [
    "full-time",
    "part-time",
    "contract",
    "internship",
]);

export const jobModeEnum = pgEnum("job_mode", ["on-site", "remote", "hybrid"]);

export const jobPreferences = pgTable("job_preferences", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").array().notNull(),
    type: jobTypeEnum("type").notNull(),
    mode: jobModeEnum("mode").notNull(),
    location: text("location").array().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export type JobPreference = typeof jobPreferences.$inferSelect;
export type JobPreferenceInsert = typeof jobPreferences.$inferInsert;