import { runSeed } from "./src/seed";
import { closeDb } from "@mirai-app/db";

try {
  await runSeed();
  await closeDb();
  console.log("Done.");
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
