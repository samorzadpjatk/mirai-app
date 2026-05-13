import { runSeed } from "./src/seed";

try {
  await runSeed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}
