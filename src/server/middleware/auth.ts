import { User } from "@/db/schema"
import { auth } from "@/lib/auth"
import Elysia from "elysia"

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const session = await auth.api.getSession({
                    headers
                })

                if (!session) return status(401)

                return {
                    user: session.user as User,
                    session: session.session
                }
            }
        }
    })
