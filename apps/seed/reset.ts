import { closeDb } from "@mirai-app/db";
import { db } from "./src/config/db";
import { supabase } from "./src/config/supabase";
import { env } from "./src/config/env";
import {
  trips,
  tripParticipants,
  sponsors,
  tripSponsors,
  rewards,
  rewardPurchases,
  coinTransactions,
  tripResources,
  tripInsuranceSteps,
  tripInsurances,
} from "@mirai-app/db";

const MAX_FILES_PER_BUCKET = 1000;

const cleanStorageBucket = async (bucket: string) => {
  console.log(`Cleaning bucket: ${bucket}`);

  const { data: files, error: listError } = await supabase.storage.from(bucket).list("", {
    limit: MAX_FILES_PER_BUCKET,
  });

  if (listError) {
    console.warn(`  ✗ Failed to list files: ${listError.message}`);
    return;
  }

  if (!files || files.length === 0) {
    console.log(`  ✓ Bucket is already empty`);
    return;
  }

  const filePaths = files.map((f) => f.name);
  const { error: deleteError } = await supabase.storage.from(bucket).remove(filePaths);

  if (deleteError) {
    console.warn(`  ✗ Failed to delete files: ${deleteError.message}`);
  } else {
    console.log(`  ✓ Removed ${filePaths.length} files`);
  }

  const { data: remainingFiles } = await supabase.storage.from(bucket).list("", {
    limit: MAX_FILES_PER_BUCKET,
  });

  if (remainingFiles && remainingFiles.length > 0) {
    const remainingPaths = remainingFiles.map((f) => f.name);
    await supabase.storage.from(bucket).remove(remainingPaths);
  }
};

const cleanStorage = async () => {
  for (const bucket of [env.imageBucket, env.publicBucket, env.videoBucket]) {
    await cleanStorageBucket(bucket);
  }
};

const cleanDatabase = async () => {
  console.log("Cleaning database...");

  await db.delete(tripInsuranceSteps);
  console.log("  ✓ Deleted trip insurance steps");

  await db.delete(tripInsurances);
  console.log("  ✓ Deleted trip insurances");

  await db.delete(tripResources);
  console.log("  ✓ Deleted trip resources");

  await db.delete(rewardPurchases);
  console.log("  ✓ Deleted reward purchases");

  await db.delete(coinTransactions);
  console.log("  ✓ Deleted coin transactions");

  await db.delete(rewards);
  console.log("  ✓ Deleted rewards");

  await db.delete(tripSponsors);
  console.log("  ✓ Deleted trip sponsors");

  await db.delete(sponsors);
  console.log("  ✓ Deleted sponsors");

  await db.delete(tripParticipants);
  console.log("  ✓ Deleted trip participants");

  await db.delete(trips);
  console.log("  ✓ Deleted trips");

  console.log("  ✓ Kept users (auth users remain)");
  console.log("✓ Database cleaned");
};

const runReset = async () => {
  const arg = process.argv.find((a) => a === "--dev" || a === "--prod");
  const seedEnv = arg === "--prod" ? "prod" : "dev";

  console.log(`Resetting environment: ${seedEnv}`);

  await cleanStorage();
  await cleanDatabase();

  console.log("Reset completed. You can now run the seed.");
};

try {
  await runReset();
  await closeDb();
  console.log("Done.");
} catch (error) {
  console.error("Reset failed:", error);
  process.exit(1);
}
