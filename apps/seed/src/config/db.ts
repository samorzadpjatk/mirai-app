import { createPrismaClient } from "@mirai-app/frameworks/prisma";
import { env } from "./env";

export const prisma = await createPrismaClient(env.databaseUrl);
