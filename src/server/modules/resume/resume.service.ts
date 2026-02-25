import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { TX } from "@/db/types";
import { JobPreference, resume, ResumeInsert } from "@/db/schema";
import { deleteFile, uploadFile } from "@/lib/s3";
import { extractLinks, extractText, getDocumentProxy } from "unpdf";
import { embed, generateText, Output } from "ai";
import { getModel, getEmbeddingModel } from "@/lib/ai";
import {
    ATS_ANALYSIS_SYSTEM_PROMPT,
    RESUME_EXTRACTION_SYSTEM_PROMPT,
    SECTION_ANALYSIS_SYSTEM_PROMPT,
    SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
    TAILOR_RESUME_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/system/resume.system.prompt";
import {
    ATSAnalysisPrompt,
    buildResumeExtractionPrompt,
    buildSectionAnalysisPrompt,
    buildSemanticAnalysisPrompt,
    buildTailorResumePrompt,
} from "@/lib/ai/prompts/tasks/resume.task.prompt";
import {
    ATSAnalysisSchema,
    ResumeProfile,
    ResumeProfileSchema,
    SectionAnalysisSchema,
    SemanticAnalysisSchema,
} from "@/lib/ai/schemas/resume.schema";

export const resumeService = {
    async parse(file: File) {
        const pdf = await getDocumentProxy(
            new Uint8Array(await file.arrayBuffer()),
        );
        const { text } = await extractText(pdf, { mergePages: true });
        const { links } = await extractLinks(pdf);

        return { text, links };
    },
    async create({ data, tx }: { data: ResumeInsert; tx?: TX }) {
        const values = {
            userId: data.userId,
            fileName: data.fileName,
            key: data.key,
            text: data.text,
            links: data.links,
        };

        if (tx) {
            return await tx.insert(resume).values(values);
        }

        return await db.insert(resume).values(values);
    },
    async uploadAndSave(file: File, userId: string, tx?: TX) {
        const { text, links } = await this.parse(file);

        const res = await uploadFile(file);

        if (!res.success) {
            throw new Error(res.error || "Failed to upload resume");
        }

        const data: ResumeInsert = {
            userId,
            fileName: file.name,
            key: res.key!,
            text,
            links,
        };

        try {
            return await this.create({ data, tx });
        } catch (err) {
            await deleteFile(res.key!);
            throw err as Error;
        }
    },
    async updateResume(id: string, data: Partial<ResumeInsert>) {
        const [updated] = await db
            .update(resume)
            .set(data)
            .where(eq(resume.id, id))
            .returning();

        return updated;
    },
    async structuredOutput(text: string, links: string[]) {
        const { output } = await generateText({
            model: getModel(),
            system: RESUME_EXTRACTION_SYSTEM_PROMPT,
            prompt: buildResumeExtractionPrompt({ text, links }),
            output: Output.object({
                schema: ResumeProfileSchema,
            }),
        });

        return output;
    },
    async atsAnalysis(fileBuffer: ArrayBuffer) {
        const { output } = await generateText({
            model: getModel(),
            system: ATS_ANALYSIS_SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: ATSAnalysisPrompt(),
                        },
                        {
                            type: "file",
                            data: new Uint8Array(fileBuffer),
                            mediaType: "application/pdf",
                        },
                    ],
                },
            ],
            output: Output.object({
                schema: ATSAnalysisSchema,
            }),
        });

        return output;
    },
    async sectionAnalysis(text: string) {
        const { output } = await generateText({
            model: getModel(),
            system: SECTION_ANALYSIS_SYSTEM_PROMPT,
            prompt: buildSectionAnalysisPrompt(text),
            output: Output.object({
                schema: SectionAnalysisSchema,
            }),
        });

        return output;
    },
    async semanticAnalysis(
        text: string,
        jobPreferences: Omit<
            JobPreference,
            "id" | "userId" | "createdAt" | "updatedAt"
        >,
    ) {
        const { output } = await generateText({
            model: getModel(),
            system: SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
            prompt: buildSemanticAnalysisPrompt(text, jobPreferences),
            output: Output.object({
                schema: SemanticAnalysisSchema,
            }),
        });

        return output;
    },
    async tailorResume(resumeData: ResumeProfile, jobTitle: string, jobDescription: string) {
        const { output } = await generateText({
            model: getModel(),
            system: TAILOR_RESUME_SYSTEM_PROMPT,
            prompt: buildTailorResumePrompt(JSON.stringify(resumeData), jobTitle, jobDescription),
            output: Output.object({
                schema: ResumeProfileSchema,
            }),
        });

        return output;
    },
    prepareResumeForEmbedding(resume: ResumeProfile): string {
        const parts: string[] = [];

        if (resume.summary) {
            parts.push(`Professional Summary:\n${resume.summary}`);
        }

        if (resume.skills) {
            const allSkills = [
                ...(resume.skills.languages || []),
                ...(resume.skills.frameworks || []),
                ...(resume.skills.mlAndAi || []),
                ...(resume.skills.devops || []),
                ...(resume.skills.databases || []),
                ...(resume.skills.tools || []),
                ...(resume.skills.other || []),
            ];

            if (allSkills.length > 0) {
                parts.push(`Skills:\n${allSkills.join(", ")}`);
            }
        }

        if (resume.experience?.length) {
            const expText = resume.experience
                .map((exp) => {
                    return [
                        `${exp.position} at ${exp.company}`,
                        exp.description,
                        exp.achievements?.join(". "),
                        exp.technologies?.length
                            ? `Technologies: ${exp.technologies.join(", ")}`
                            : null,
                    ]
                        .filter(Boolean)
                        .join(". ");
                })
                .join("\n\n");

            parts.push(`Work Experience:\n${expText}`);
        }

        if (resume.projects?.length) {
            const projectText = resume.projects
                .map((proj) => {
                    return [
                        proj.title,
                        proj.description,
                        proj.highlights?.join(". "),
                        proj.technologies?.length
                            ? `Technologies: ${proj.technologies.join(", ")}`
                            : null,
                    ]
                        .filter(Boolean)
                        .join(". ");
                })
                .join("\n\n");

            parts.push(`Projects:\n${projectText}`);
        }

        if (resume.education?.length) {
            const eduText = resume.education
                .map((edu) =>
                    [
                        `${edu.degree} from ${edu.school}`,
                        edu.cgpaOrPercentage ? `Grade: ${edu.cgpaOrPercentage}` : null,
                    ]
                        .filter(Boolean)
                        .join(". "),
                )
                .join("\n");

            parts.push(`Education:\n${eduText}`);
        }

        if (resume.certifications?.length) {
            const certText = resume.certifications
                .map((cert) => `${cert.title} by ${cert.issuer}`)
                .join("\n");

            parts.push(`Certifications:\n${certText}`);
        }

        return parts.join("\n\n");
    },
    async generateEmbedding(text: string): Promise<number[]> {
        const { embedding } = await embed({
            model: getEmbeddingModel().model,
            value: text,
            providerOptions: getEmbeddingModel().providerOptions,
        });

        return embedding;
    },
};
