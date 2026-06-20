import { logger } from "@mirai-app/common/utils";
import { loadAuthUsers } from "./auth";
import { env } from "./config/env";
import { assetsRoot } from "./constants";
import { loadRewardConfigs, seedRewards } from "./rewards";
import { loadSponsorConfigs, seedSponsors } from "./sponsors";
import { cleanupOldAssets, ensureBuckets, ensurePlaceholderImage, uploadAssets } from "./storage";
import { loadTripConfigs } from "./tripConfigs";
import { loadTripInfoConfig, seedTripInfo } from "./tripInfo";
import { seedTrip } from "./trips";
import type { SeedEnv, SponsorConfig } from "./types";
import { dirExists } from "./utils/fs";
import { joinPath } from "./utils/path";

export const runSeed = async () => {
  const arg = process.argv.find((a) => a === "--dev" || a === "--prod");
  const seedEnv: SeedEnv = arg === "--prod" ? "prod" : "dev";
  const envRoot = joinPath(assetsRoot, seedEnv);

  logger.info(`Seeding environment: ${seedEnv}`);
  if (!(await dirExists(envRoot))) {
    throw new Error(`Missing assets directory for environment: ${envRoot}`);
  }

  await ensureBuckets();
  await cleanupOldAssets();
  await ensurePlaceholderImage(seedEnv);
  await uploadAssets(seedEnv);

  const authUsers = await loadAuthUsers();

  const trips = await loadTripConfigs(envRoot);
  for (const trip of trips) {
    const seededTrip = await seedTrip(trip, trip.users, envRoot, authUsers);

    if (!seededTrip) {
      logger.warn(`✗ Failed to seed trip: ${trip.key}`);
      continue;
    }

    // Seed sponsors for the trip
    try {
      let sponsorConfigs: SponsorConfig[] = [];
      if (trip.sponsors) {
        sponsorConfigs = await loadSponsorConfigs(envRoot, trip.sponsors);
      }
      await seedSponsors(env.databaseUrl!, seededTrip.id, seedEnv, sponsorConfigs);
    } catch (error) {
      logger.warn(error, `✗ Failed to seed sponsors for trip ${trip.key}`);
    }

    // Seed rewards if the trip has a rewards config
    if (trip.rewards) {
      try {
        const rewardConfigs = await loadRewardConfigs(envRoot, trip.rewards);
        await seedRewards(rewardConfigs, seededTrip.id, authUsers);
      } catch (error) {
        logger.warn(error, `✗ Failed to seed rewards for trip ${trip.key}`);
      }
    }

    // Seed trip info if the trip has an info config
    if (trip.info) {
      try {
        const infoConfig = await loadTripInfoConfig(envRoot, trip.info);
        await seedTripInfo(env.databaseUrl!, seededTrip.id, seedEnv, infoConfig);
      } catch (error) {
        logger.warn(error, `✗ Failed to seed trip info for trip ${trip.key}`);
      }
    }
  }

  logger.info("Seeding completed");
};
