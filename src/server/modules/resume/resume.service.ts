import { db } from '@/db/drizzle';
import { resume, ResumeInsert } from '@/db/schema';
import { TX } from '@/db/types';
import { deleteFile, uploadFile } from '@/lib/s3';
import { extractText, getDocumentProxy } from 'unpdf'

export const resumeService = {
    async parse(file: File) {
        const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
        const { text } = await extractText(pdf, { mergePages: true })

        return text;
    },
    async create({ data, tx }: { data: ResumeInsert, tx?: TX }) {
        const values = {
            userId: data.userId,
            fileName: data.fileName,
            key: data.key,
            text: data.text,
        };

        if (tx) {
            return await tx.insert(resume).values(values);
        }

        return await db.insert(resume).values(values);
    },
    async uploadAndSave(file: File, userId: string, tx?: TX) {
        const text = await this.parse(file);

        const res = await uploadFile(file);

        if (!res.success) {
            throw new Error(res.error || "Failed to upload resume");
        }

        const data: ResumeInsert = {
            userId,
            fileName: file.name,
            key: res.key!,
            text,
        };

        try {
            return await this.create({ data, tx });
        } catch (err) {
            await deleteFile(res.key!);
            throw err as Error;
        }
    },
}