import { db } from "@/db/drizzle";

export type DB = typeof db;
export type TX = Parameters<Parameters<DB['transaction']>[0]>[0];