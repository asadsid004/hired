import { Elysia, t } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { resume } from '@/db/schema/resume-schema';
import { jobs } from '@/db/schema/jobs-schema';
import { user as userTable } from '@/db/schema/auth-schema';
import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { resumeService } from './resume.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { embedding, ...resumeColumnsWithoutEmbedding } = getTableColumns(resume);

export const resumeRoutes = new Elysia({ prefix: '/resume' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {
        const results = await db
            .select({
                id: resume.id,
                fileName: resume.fileName,
                key: resume.key,
                jobId: resume.jobId,
                jobTitle: jobs.jobTitle,
                company: jobs.company,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
            })
            .from(resume)
            .leftJoin(jobs, eq(resume.jobId, jobs.id))
            .where(eq(resume.userId, user.id))
            .orderBy(desc(resume.createdAt));

        return results;
    }, {
        auth: true
    })
    .post('/upload', async ({ body, user }) => {
        const file = body.file;

        // Parse, upload, and save the file
        await resumeService.uploadAndSave(file, user.id);

        // Get the saved resume (text and links are already stored by uploadAndSave)
        const [savedResume] = await db
            .select()
            .from(resume)
            .where(eq(resume.userId, user.id))
            .orderBy(desc(resume.createdAt))
            .limit(1);

        if (!savedResume) {
            throw new Error("Resume save failed");
        }

        // Extract structured data using already-stored text/links
        const structuredData = await resumeService.structuredOutput(
            savedResume.text,
            savedResume.links ?? []
        );

        // Update resume with extracted data
        const [updated] = await db
            .update(resume)
            .set({ data: structuredData, updatedAt: new Date() })
            .where(eq(resume.id, savedResume.id))
            .returning();

        return updated;
    }, {
        auth: true,
        body: t.Object({
            file: t.File({ type: 'application/pdf' }),
        }),
    })
    .post('/create', async ({ body, user }) => {
        const { jobTitle, jobDescription, fileName, jobId } = body;

        // Get user profile
        const [userData] = await db
            .select({ profile: userTable.profile })
            .from(userTable)
            .where(eq(userTable.id, user.id));

        if (!userData?.profile) {
            throw new Error("No profile found. Please complete onboarding first.");
        }

        // Tailor resume from user profile
        const tailoredData = await resumeService.tailorResume(
            userData.profile,
            jobTitle,
            jobDescription
        );

        // If jobId provided, check if a tailored resume already exists for this job
        if (jobId) {
            const [existing] = await db
                .select({ id: resume.id })
                .from(resume)
                .where(
                    and(
                        eq(resume.userId, user.id),
                        eq(resume.jobId, jobId)
                    )
                );

            if (existing) {
                // Re-tailor: update in place
                const [updated] = await db
                    .update(resume)
                    .set({
                        data: tailoredData,
                        fileName: fileName || `${jobTitle} Resume`,
                        updatedAt: new Date(),
                    })
                    .where(eq(resume.id, existing.id))
                    .returning();

                return updated;
            }
        }

        // Create a new resume record
        const [newResume] = await db
            .insert(resume)
            .values({
                userId: user.id,
                jobId: jobId ?? null,
                fileName: fileName || `${jobTitle} Resume`,
                key: '',
                text: '',
            })
            .returning();

        // Update with the tailored data
        const [updated] = await db
            .update(resume)
            .set({ data: tailoredData, updatedAt: new Date() })
            .where(eq(resume.id, newResume.id))
            .returning();

        return updated;
    }, {
        auth: true,
        body: t.Object({
            jobTitle: t.String(),
            jobDescription: t.String(),
            fileName: t.Optional(t.String()),
            jobId: t.Optional(t.Number()),
        }),
    })
    .get('/by-job/:jobId', async ({ params, user }) => {
        const [result] = await db
            .select({
                id: resume.id,
                fileName: resume.fileName,
                createdAt: resume.createdAt,
                updatedAt: resume.updatedAt,
            })
            .from(resume)
            .where(
                and(
                    eq(resume.userId, user.id),
                    eq(resume.jobId, parseInt(params.jobId))
                )
            )
            .limit(1);

        return result ?? null;
    }, {
        auth: true,
        params: t.Object({
            jobId: t.String()
        })
    })
    .get('/:id', async ({ params, user }) => {
        const results = await db
            .select()
            .from(resume)
            .where(
                and(
                    eq(resume.id, params.id),
                    eq(resume.userId, user.id)
                )
            );

        if (results.length === 0) {
            throw new Error("Resume not found");
        }

        return results[0];
    }, {
        auth: true,
        params: t.Object({
            id: t.String()
        })
    })
    .patch('/:id/data', async ({ params, body, user }) => {
        const { data } = body;
        const updated = await db
            .update(resume)
            .set({ data, updatedAt: new Date() })
            .where(
                and(
                    eq(resume.id, params.id),
                    eq(resume.userId, user.id)
                )
            )
            .returning();

        if (updated.length === 0) {
            throw new Error("Resume not found or not updated");
        }

        return updated[0];
    }, {
        auth: true,
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            data: t.Any()
        })
    })
    .delete('/:id', async ({ params, user }) => {
        const deleted = await db
            .delete(resume)
            .where(
                and(
                    eq(resume.id, params.id),
                    eq(resume.userId, user.id)
                )
            )
            .returning();

        if (deleted.length === 0) {
            throw new Error("Resume not found or not deleted");
        }

        return deleted[0];
    }, {
        auth: true,
        params: t.Object({
            id: t.String()
        })
    })
    .post('/:id/tailor', async ({ params, body, user }) => {
        const { jobTitle, jobDescription } = body;

        const results = await db
            .select()
            .from(resume)
            .where(
                and(
                    eq(resume.id, params.id),
                    eq(resume.userId, user.id)
                )
            );

        if (results.length === 0) {
            throw new Error("Resume not found");
        }

        const currentResume = results[0];
        if (!currentResume.data) {
            throw new Error("Resume data not found");
        }

        const tailoredData = await resumeService.tailorResume(
            currentResume.data,
            jobTitle,
            jobDescription
        );

        const updated = await db
            .update(resume)
            .set({ data: tailoredData, updatedAt: new Date() })
            .where(eq(resume.id, params.id))
            .returning();

        return updated[0];
    }, {
        auth: true,
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            jobTitle: t.String(),
            jobDescription: t.String()
        })
    });
