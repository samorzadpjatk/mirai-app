import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { env } from "./env";

export const db = createDrizzleClient(env.databaseUrl);
