import { Elysia } from 'elysia'

import { betterAuth } from '@/routes/auth'

const app = new Elysia({ prefix: '/api' })
    .use(betterAuth)
    .get('/user', ({ user }) => user, {
        auth: true
    })

export type App = typeof app

export const GET = app.fetch
export const POST = app.fetch
export const PUT = app.fetch
export const DELETE = app.fetch