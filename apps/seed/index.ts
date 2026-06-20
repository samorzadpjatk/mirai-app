import { logger } from "@mirai-app/common/utils";
import { closeDb } from "@mirai-app/db";
import { runSeed } from "./src/seed";

try {
  await runSeed();
  await closeDb();
  logger.info("Done.");
} catch (error) {
  logger.error(error, "Seed failed");
  process.exit(1);
}
