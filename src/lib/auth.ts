import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dbEdge } from "@/db/db-edge";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
    database: drizzleAdapter(dbEdge, {
        provider: "pg",
    }),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    user: {
        additionalFields: {
            onboardingCompleted: {
                type: "boolean",
                defaultValue: false,
                required: false,
            }
        }
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60,
        }
    },
    plugins: [nextCookies()]
});