import { treaty } from '@elysiajs/eden'
import type { App } from "@/server"

export const client = treaty<App>(process.env.NEXT_PUBLIC_API_URL!).api
