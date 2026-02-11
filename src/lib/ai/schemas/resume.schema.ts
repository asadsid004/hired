import { z } from 'zod';

export const SocialSchema = z.object({
    platform: z.enum(['linkedin', 'github', 'twitter', 'portfolio', 'stackoverflow', 'medium', 'kaggle', 'other']),
    url: z.url(),
    username: z.string().nullable().optional(),
});

export const LocationSchema = z.object({
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
});

export const PersonalInfoSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    phone: z.string().nullable().optional(),
    location: LocationSchema.nullable().optional(),
});

export const SkillsCategorySchema = z.object({
    languages: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
    mlAndAi: z.array(z.string()).optional(),
    devops: z.array(z.string()).optional(),
    databases: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    other: z.array(z.string()).optional(),
});

export const ExperienceSchema = z.object({
    company: z.string(),
    position: z.string(),
    location: z.string().nullable().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
    isCurrent: z.boolean(),
    description: z.string().nullable().optional(),
    achievements: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
});

export const EducationSchema = z.object({
    degree: z.string(),
    school: z.string(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    cgpaOrPercentage: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
});

export const ProjectLinkSchema = z.object({
    type: z.enum(['github', 'live', 'demo', 'docs', 'other']),
    url: z.string().url(),
    stars: z.number().nullable().optional(),
});

export const ProjectSchema = z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    highlights: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    links: z.array(ProjectLinkSchema).optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    status: z.enum(['completed', 'in-progress', 'archived']).nullable().optional(),
});

export const CertificationSchema = z.object({
    title: z.string(),
    issuer: z.string(),
    issueDate: z.string().nullable().optional(),
    expiryDate: z.string().nullable().optional(),
    credentialId: z.string().nullable().optional(),
    credentialUrl: z.string().url().nullable().optional(),
});

export const LanguageSchema = z.object({
    language: z.string(),
    proficiency: z.enum(['native', 'fluent', 'professional', 'intermediate', 'basic']),
});

export const ResumeProfileSchema = z.object({
    personalInfo: PersonalInfoSchema,
    socials: z.array(SocialSchema).optional(),
    summary: z.string().nullable().optional(),
    skills: SkillsCategorySchema.optional(),
    experience: z.array(ExperienceSchema).optional(),
    education: z.array(EducationSchema).optional(),
    projects: z.array(ProjectSchema).optional(),
    certifications: z.array(CertificationSchema).optional(),
    languages: z.array(LanguageSchema).optional(),
    achievements: z.array(z.string()).optional(),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;
