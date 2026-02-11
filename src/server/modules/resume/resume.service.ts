import { db } from '@/db/drizzle';
import { JobPreference, resume, ResumeInsert } from '@/db/schema';
import { TX } from '@/db/types';
import { deleteFile, uploadFile } from '@/lib/s3';
import { extractLinks, extractText, getDocumentProxy } from 'unpdf'
import { generateText, Output } from 'ai';
import { getModel } from '@/lib/ai';
import { ATS_ANALYSIS_SYSTEM_PROMPT, RESUME_EXTRACTION_SYSTEM_PROMPT, SECTION_ANALYSIS_SYSTEM_PROMPT, SEMANTIC_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts/system/resume.system.prompt';
import { ATSAnalysisPrompt, buildResumeExtractionPrompt, buildSectionAnalysisPrompt, buildSemanticAnalysisPrompt } from '@/lib/ai/prompts/tasks/resume.task.prompt';
import { ATSAnalysisSchema, ResumeProfileSchema, SectionAnalysisSchema, SemanticAnalysisSchema } from '@/lib/ai/schemas/resume.schema';
import { eq } from 'drizzle-orm';

export const resumeService = {
    async parse(file: File) {
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
        const { text } = await extractText(pdf, { mergePages: true })
        const { links } = await extractLinks(pdf)

        return { text, links };
    },
    async create({ data, tx }: { data: ResumeInsert, tx?: TX }) {
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
        const [updated] = await db.update(resume).set(data).where(eq(resume.id, id)).returning();

        return updated;
    },
    async structuredOutput(id: string, text: string, links: string[]) {
        const { output } = await generateText({
            model: getModel(),
            system: RESUME_EXTRACTION_SYSTEM_PROMPT,
            prompt: buildResumeExtractionPrompt({ text, links }),
            output: Output.object({
                schema: ResumeProfileSchema
            })
        })

        return output;
    },
    async atsAnalysis(file: File) {
        const { output } = await generateText({
            model: getModel(),
            system: ATS_ANALYSIS_SYSTEM_PROMPT,
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: ATSAnalysisPrompt(),
                    },
                    {
                        type: "file",
                        data: new Uint8Array(await file.arrayBuffer()),
                        mediaType: "application/pdf"
                    }
                ],
            }],
            output: Output.object({
                schema: ATSAnalysisSchema
            })
        })

        return output;
    },
    async sectionAnalysis(text: string) {
        const { output } = await generateText({
            model: getModel(),
            system: SECTION_ANALYSIS_SYSTEM_PROMPT,
            prompt: buildSectionAnalysisPrompt(text),
            output: Output.object({
                schema: SectionAnalysisSchema,
            })
        })

        return output;
    },
    async semanticAnalysis(text: string, jobPreferences: JobPreference) {
        const { output } = await generateText({
            model: getModel(),
            system: SEMANTIC_ANALYSIS_SYSTEM_PROMPT,
            prompt: buildSemanticAnalysisPrompt(text, jobPreferences),
            output: Output.object({
                schema: SemanticAnalysisSchema,
            })
        })

        return output;
    },
}