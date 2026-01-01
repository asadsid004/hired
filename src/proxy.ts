import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        query: {
            disableCookieCache: true,
        },
        headers: await headers(),
    })

    if (!session) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (!session.user.onboardingCompleted) {
        return NextResponse.redirect(new URL(`/onboarding`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard"],
};