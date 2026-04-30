import { z } from 'zod';

export const ParsedJobDescriptionSchema = z.object({
    jobSummary: z.string().describe('Summary of the job description'),
    keyResponsibilities: z.array(z.string()).describe('List of key responsibilities extracted from the job description'),
    mustHaveSkills: z.array(z.string()).describe('Skills explicitly required — mandatory qualifications'),
    niceToHaveSkills: z.array(z.string()).describe('Skills listed as preferred or bonus — not strictly required'),
    benefits: z.array(z.string()).describe('Perks and benefits mentioned in the listing'),
    salaryRange: z.object({
        min: z.number().nullable().describe('Minimum salary if mentioned'),
        max: z.number().nullable().describe('Maximum salary if mentioned'),
        currency: z.string().nullable().describe('Currency code, e.g. USD'),
        period: z.string().nullable().describe('Pay period, e.g. yearly, monthly, hourly'),
    }).describe('Salary range details extracted from the description'),
    // teamSize: z.string().describe('Team size or team description if mentioned, empty string if not mentioned'),
    techStack: z.array(z.string()).describe('Specific technologies, languages, frameworks, and tools mentioned'),
    interviewProcess: z.string().describe('Description of the interview process if mentioned, empty string if not'),
    // estimatedSenioritySignals: z.array(z.string()).describe('Phrases or signals that indicate the seniority level expected'),
});

export type ParsedJobDescription = z.infer<typeof ParsedJobDescriptionSchema>;
