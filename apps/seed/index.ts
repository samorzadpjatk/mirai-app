import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { serverLogger } from "@mirai-app/shared";
import { env } from "./config/env";
import { runSeed } from "./src/seed";

const db = createDrizzleClient(env.databaseUrl);

try {
  await runSeed();
} catch (error) {
  serverLogger.error(
    "Seed failed:",
    error instanceof Error ? error : new Error(String(error)),
  );
  process.exitCode = 1;
} finally {
  // Drizzle doesn't have a direct disconnect method, but the pool will be closed
  // when the process exits
  serverLogger.info("Seed process completed");
}
