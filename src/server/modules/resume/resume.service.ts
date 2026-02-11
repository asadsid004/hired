import { db } from '@/db/drizzle';
import { resume, ResumeInsert } from '@/db/schema';
import { TX } from '@/db/types';
import { deleteFile, uploadFile } from '@/lib/s3';
import { extractLinks, extractText, getDocumentProxy } from 'unpdf'
import { generateText, Output } from 'ai';
import { model } from '@/lib/ai';
import { RESUME_EXTRACTION_SYSTEM_PROMPT } from '@/lib/ai/prompts/system/resume.system.prompt';
import { buildResumeExtractionPrompt } from '@/lib/ai/prompts/tasks/resume.task.prompt';
import { ResumeProfileSchema } from '@/lib/ai/schemas/resume.schema';
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
            model: model,
            system: RESUME_EXTRACTION_SYSTEM_PROMPT,
            prompt: buildResumeExtractionPrompt({ text, links }),
            output: Output.object({
                schema: ResumeProfileSchema
            })
        })

        return output;
    },
}