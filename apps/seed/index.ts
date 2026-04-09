import { createPrismaClient } from "@mirai-app/frameworks/prisma";
import { env } from "./src/config/env";
import { runSeed } from "./src/seed";

const db = await createPrismaClient(env.databaseUrl);

try {
  await runSeed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
