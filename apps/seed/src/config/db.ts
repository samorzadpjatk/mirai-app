import { createDb } from "@mirai-app/db";
import { env } from "./env";

export const db = createDb(env.databaseUrl as string);
