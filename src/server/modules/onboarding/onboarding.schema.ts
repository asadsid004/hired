import { Static, t } from "elysia";

export const onboardingSchema = t.Object({
    role: t.Union([
        t.Array(t.String({
            minLength: 1
        }), {
            minItems: 1,
            maxItems: 2
        }),
        t.String({
            minLength: 1
        })
    ]),
    type: t.Union([
        t.Literal("full-time"),
        t.Literal("part-time"),
        t.Literal("internship"),
    ]),
    mode: t.Union([
        t.Literal("remote"),
        t.Literal("hybrid"),
        t.Literal("on-site"),
    ]),
    location: t.Union(
        [
            t.Array(t.String({
                minLength: 1
            }), {
                minItems: 1,
                maxItems: 5
            }),
            t.String({
                minLength: 1
            })
        ]
    ),
    resume: t.File({
        type: "application/pdf",
        maxSize: 5 * 1024 * 1024,
    })
})

export type OnboardingData = Static<typeof onboardingSchema>