import { createDb } from "@mirai-app/db";
import { env } from "./env";

export const prisma = createDb(env.databaseUrl);
