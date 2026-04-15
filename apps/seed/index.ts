import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { env } from "./config/env";
import { runSeed } from "./src/seed";

const db = createDrizzleClient(env.databaseUrl);

try {
  await runSeed();
} catch {
  process.exitCode = 1;
}
