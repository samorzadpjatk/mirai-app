import { assetsRoot } from "./constants";
import { ensureBuckets, uploadAssets, ensurePlaceholderImage } from "./storage";
import { loadAuthUsers } from "./auth";
import { loadTripConfigs } from "./tripConfigs";
import { seedTrip } from "./trips";
import { loadRewardConfigs, seedRewards } from "./rewards";
import { loadSponsorConfigs, seedSponsors } from "./sponsors";
import { loadTripInfoConfig, seedTripInfo } from "./tripInfo";
import { dirExists } from "./utils/fs";
import { joinPath } from "./utils/path";
import { env } from "./config/env";
import type { SeedEnv, SponsorConfig } from "./types";

export const runSeed = async () => {
  const arg = process.argv.find((a) => a === "--dev" || a === "--prod");
  const seedEnv: SeedEnv = arg === "--prod" ? "prod" : "dev";
  const envRoot = joinPath(assetsRoot, seedEnv);

  console.log(`Seeding environment: ${seedEnv}`);
  if (!(await dirExists(envRoot))) {
    throw new Error(`Missing assets directory for environment: ${envRoot}`);
  }

  await ensureBuckets();
  await ensurePlaceholderImage(seedEnv);
  await uploadAssets(seedEnv);

  const authUsers = await loadAuthUsers();

  const trips = await loadTripConfigs(envRoot);
  for (const trip of trips) {
    const seededTrip = await seedTrip(trip, trip.users, envRoot, authUsers);
    
    if (!seededTrip) {
      console.warn(`✗ Failed to seed trip: ${trip.key}`);
      continue;
    }
    
    // Seed sponsors for the trip
    try {
      let sponsorConfigs: SponsorConfig[] = [];
      if (trip.sponsors) {
        sponsorConfigs = await loadSponsorConfigs(envRoot, trip.sponsors);
      }
      await seedSponsors(env.databaseUrl, seededTrip.id, seedEnv, sponsorConfigs);
    } catch (error) {
      console.warn(`✗ Failed to seed sponsors for trip ${trip.key}:`, error);
    }
    
    // Seed rewards if the trip has a rewards config
    if (trip.rewards) {
      try {
        const rewardConfigs = await loadRewardConfigs(envRoot, trip.rewards);
        await seedRewards(rewardConfigs, seededTrip.id, authUsers);
      } catch (error) {
        console.warn(`✗ Failed to seed rewards for trip ${trip.key}:`, error);
      }
    }

    // Seed trip info if the trip has an info config
    if (trip.info) {
      try {
        const infoConfig = await loadTripInfoConfig(envRoot, trip.info);
        await seedTripInfo(env.databaseUrl, seededTrip.id, seedEnv, infoConfig);
      } catch (error) {
        console.warn(`✗ Failed to seed trip info for trip ${trip.key}:`, error);
      }
    }
  }

  console.log("Seeding completed");
};
