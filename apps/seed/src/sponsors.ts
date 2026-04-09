import { createPrismaClient } from "@repo/frameworks/prisma";
import type { Sponsor, TripSponsor } from "@repo/frameworks/prisma";
import type { SeedEnv, SponsorConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

export const loadSponsorConfigs = async (
  envRoot: string,
  sponsorsPath: string,
): Promise<SponsorConfig[]> => {
  const sponsorConfigPath = joinPath(envRoot, sponsorsPath);
  const content = await readTextFile(sponsorConfigPath);
  const parsed = yaml.parse(content) as SponsorConfig[];
  return parsed || [];
};

export const seedSponsors = async (
  databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  sponsorConfigs: SponsorConfig[],
): Promise<void> => {
  const db = createDb(databaseUrl);

  console.log("Seeding sponsors...");

  if (sponsorConfigs.length === 0) {
    console.log("No sponsors configured, skipping...");
    return;
  }

  try {
    // Create sponsors
    for (const sponsorConfig of sponsorConfigs) {
      const sponsor: Omit<Sponsor, "id" | "createdAt" | "updatedAt"> = {
        name: sponsorConfig.name,
        description: sponsorConfig.description,
        logoPath: sponsorConfig.logoPath,
        height: sponsorConfig.height ?? null,
        offsetX: sponsorConfig.offsetX ?? null,
        offsetY: sponsorConfig.offsetY ?? null,
        isActive: true,
      };

      await db.sponsor.upsert({
        where: { id: sponsorConfig.id },
        update: sponsor,
        create: {
          id: sponsorConfig.id,
          ...sponsor,
        },
      });

      console.log(`✓ Seeded sponsor: ${sponsorConfig.name}`);
    }

    // Associate sponsors with the trip
    for (const sponsorConfig of sponsorConfigs) {
      const tripSponsor: Omit<TripSponsor, "id" | "createdAt"> = {
        tripId,
        sponsorId: sponsorConfig.id,
      };

      await db.tripSponsor.upsert({
        where: {
          tripId_sponsorId: {
            tripId,
            sponsorId: sponsorConfig.id,
          },
        },
        update: tripSponsor,
        create: tripSponsor,
      });

      console.log(`✓ Associated sponsor ${sponsorConfig.name} with trip`);
    }

    console.log("✓ Sponsors seeding completed");
  } catch (error) {
    console.error("✗ Failed to seed sponsors:", error);
    throw error;
  }
};
