import { logger } from "@mirai-app/common/utils";
import { closeDb } from "@mirai-app/db";
import {
  coinTransactions,
  rewardPurchases,
  rewards,
  sponsors,
  tripInsuranceSteps,
  tripInsurances,
  tripParticipants,
  tripResourceFiles,
  tripResourceIcons,
  tripResourceLinks,
  tripResourceTexts,
  tripSponsors,
  trips,
} from "@mirai-app/db";
import { db } from "./src/config/db";
import { env } from "./src/config/env";
import { supabase } from "./src/config/supabase";

const MAX_FILES_PER_BUCKET = 1000;

const cleanStorageBucket = async (bucket: string) => {
  logger.info(`Cleaning bucket: ${bucket}`);

  const { data: files, error: listError } = await supabase.storage.from(bucket).list("", {
    limit: MAX_FILES_PER_BUCKET,
  });

  if (listError) {
    logger.warn(`  ✗ Failed to list files: ${listError.message}`);
    return;
  }

  if (!files || files.length === 0) {
    logger.info("  ✓ Bucket is already empty");
    return;
  }

  const filePaths = files.map((f) => f.name);
  const { error: deleteError } = await supabase.storage.from(bucket).remove(filePaths);

  if (deleteError) {
    logger.warn(`  ✗ Failed to delete files: ${deleteError.message}`);
  } else {
    logger.info(`  ✓ Removed ${filePaths.length} files`);
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
  logger.info("Cleaning database...");

  await db.delete(tripInsuranceSteps);
  logger.info("  ✓ Deleted trip insurance steps");

  await db.delete(tripInsurances);
  logger.info("  ✓ Deleted trip insurances");

  await db.delete(tripResourceLinks);
  await db.delete(tripResourceFiles);
  await db.delete(tripResourceTexts);
  await db.delete(tripResourceIcons);
  logger.info("  ✓ Deleted trip resources");

  await db.delete(rewardPurchases);
  logger.info("  ✓ Deleted reward purchases");

  await db.delete(coinTransactions);
  logger.info("  ✓ Deleted coin transactions");

  await db.delete(rewards);
  logger.info("  ✓ Deleted rewards");

  await db.delete(tripSponsors);
  logger.info("  ✓ Deleted trip sponsors");

  await db.delete(sponsors);
  logger.info("  ✓ Deleted sponsors");

  await db.delete(tripParticipants);
  logger.info("  ✓ Deleted trip participants");

  await db.delete(trips);
  logger.info("  ✓ Deleted trips");

  logger.info("  ✓ Kept users (auth users remain)");
  logger.info("✓ Database cleaned");
};

const runReset = async () => {
  const arg = process.argv.find((a) => a === "--dev" || a === "--prod");
  const seedEnv = arg === "--prod" ? "prod" : "dev";

  logger.info(`Resetting environment: ${seedEnv}`);

  await cleanStorage();
  await cleanDatabase();

  logger.info("Reset completed. You can now run the seed.");
};

try {
  await runReset();
  await closeDb();
  logger.info("Done.");
} catch (error) {
  logger.error(error, "Reset failed");
  process.exit(1);
}
