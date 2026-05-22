import { runSeed } from "./src/seed";
import { closeDb } from "@mirai-app/db";
import { logger } from "@mirai-app/shared";

try {
  await runSeed();
  await closeDb();
  logger.info("Done.");
} catch (error) {
  logger.error(error, "Seed failed");
  process.exit(1);
}
