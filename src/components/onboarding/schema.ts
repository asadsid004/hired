import { z } from "zod";

export const normalizeString = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, " ");

export const roleSchema = z.object({
    role: z
        .array(z.string().min(1, "Role cannot be empty"))
        .min(1, "Add at least one job role")
        .max(2, "You can add up to 2 roles"),
});

export const typeSchema = z.object({
    type: z.enum(["full-time", "part-time", "internship"]),
});

export const workPreferenceSchema = z.object({
    mode: z.enum(["remote", "hybrid", "on-site"]),
    location: z
        .array(z.string().min(1, "Location cannot be empty"))
        .min(1, "Add at least one location")
        .max(2, "You can add up to 2 locations"),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
    "application/pdf",
];

const resumeSchema = z.object({
    resume: z
        .instanceof(File)
        .refine((file) => file.size <= MAX_FILE_SIZE, {
            message: "Resume must be less than 5MB",
        })
        .refine((file) => ACCEPTED_TYPES.includes(file.type), {
            message: "Only PDF files are allowed",
        }),
});


export const onboardingSchema = roleSchema
    .extend({ ...typeSchema.shape, ...workPreferenceSchema.shape, ...resumeSchema.shape });

export type OnboardingFormData = z.infer<typeof onboardingSchema>;