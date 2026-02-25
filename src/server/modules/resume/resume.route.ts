import { Elysia, t } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { resume } from '@/db/schema/resume-schema';
import { eq, and } from 'drizzle-orm';

export const resumeRoutes = new Elysia({ prefix: '/resume' })
    .use(authMiddleware)
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
    });
