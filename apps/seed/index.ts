import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { env } from "./config/env";
import { runSeed } from "./src/seed";

const db = createDrizzleClient(env.databaseUrl);

try {
  await runSeed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  // Drizzle doesn't have a direct disconnect method, but the pool will be closed
  // when the process exits
  console.log("Seed process completed");
}
