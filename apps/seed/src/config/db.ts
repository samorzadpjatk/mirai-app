import { createPrismaClient } from "@repo/frameworks/prisma";
import { env } from "./env";

export const prisma = await createPrismaClient(env.databaseUrl);
