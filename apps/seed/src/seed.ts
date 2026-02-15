import { assetsRoot } from "./constants";
import { ensureBuckets, uploadAssets, ensurePlaceholderImage } from "./storage";
import { loadAuthUsers } from "./auth";
import { loadTripConfigs } from "./tripConfigs";
import { seedTrip } from "./trips";
import { dirExists } from "./utils/fs";
import { joinPath } from "./utils/path";
import type { SeedEnv } from "./types";

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
    await seedTrip(trip, trip.users, envRoot, authUsers);
  }

  console.log("Seeding completed");
};
