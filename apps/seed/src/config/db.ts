import { createDb } from "@integral-2025-app/db";
import { env } from "./env";

export const prisma = createDb(env.databaseUrl);
