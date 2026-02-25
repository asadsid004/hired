import { Elysia, t } from 'elysia';
import { authMiddleware } from '@/server/middleware/auth';
import { db } from '@/db/drizzle';
import { user as userTable } from '@/db/schema/auth-schema';
import { eq } from 'drizzle-orm';
import { profileService } from './profile.service';

export const profileRoutes = new Elysia({ prefix: '/profile' })
    .use(authMiddleware)
    .get('/', async ({ user }) => {
        const userData = await db
            .select({
                profile: userTable.profile,
            })
            .from(userTable)
            .where(eq(userTable.id, user.id))
            .limit(1);

        if (userData.length === 0) {
            throw new Error("User not found");
        }

        return userData[0].profile || null;
    }, {
        auth: true
    })
    .post('/', async ({ body, user }) => {
        const validation = await profileService.validateProfile(body);
        if (!validation.isValid) {
            throw new Error(`Invalid profile data: ${validation.errors.join(', ')}`);
        }

        const profileEmbedding = await profileService.generateProfileEmbedding(body);

        const updated = await db
            .update(userTable)
            .set({
                profile: body,
                profileEmbedding,
                updatedAt: new Date()
            })
            .where(eq(userTable.id, user.id))
            .returning({
                profile: userTable.profile,
                profileEmbedding: userTable.profileEmbedding,
            });

        if (updated.length === 0) {
            throw new Error("Failed to update profile");
        }

        return updated[0].profile;
    }, {
        auth: true,
        body: t.Any(),
    })
    .put('/', async ({ body, user }) => {
        const validation = await profileService.validateProfile(body);
        if (!validation.isValid) {
            throw new Error(`Invalid profile data: ${validation.errors.join(', ')}`);
        }

        const profileEmbedding = await profileService.generateProfileEmbedding(body);

        const updated = await db
            .update(userTable)
            .set({
                profile: body,
                profileEmbedding,
                updatedAt: new Date()
            })
            .where(eq(userTable.id, user.id))
            .returning({
                profile: userTable.profile,
            });

        if (updated.length === 0) {
            throw new Error("Failed to update profile");
        }

        return updated[0].profile;
    }, {
        auth: true,
        body: t.Any(),
    })
