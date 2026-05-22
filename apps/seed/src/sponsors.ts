import { db } from "./config/db";
import type { Sponsor, TripSponsor } from "@mirai-app/db";
import type { SeedEnv, SponsorConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { sponsors, tripSponsors } from "@mirai-app/db";
import { logger } from "@mirai-app/shared";

function isSponsorConfig(value: unknown): value is SponsorConfig {
  if (typeof value !== "object" || value === null) return false;
  const sponsor = value as Record<string, unknown>;
  return (
    typeof sponsor.id === "string" &&
    typeof sponsor.name === "string" &&
    typeof sponsor.description === "string" &&
    typeof sponsor.logoPath === "string"
  );
}

export const loadSponsorConfigs = async (
  envRoot: string,
  sponsorsPath: string,
): Promise<SponsorConfig[]> => {
  const sponsorConfigPath = joinPath(envRoot, sponsorsPath);
  const content = await readTextFile(sponsorConfigPath);
  const parsed: unknown = yaml.parse(content);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isSponsorConfig);
};

export const seedSponsors = async (
  databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  sponsorConfigs: SponsorConfig[],
): Promise<void> => {
  logger.info("Seeding sponsors...");

  if (sponsorConfigs.length === 0) {
    logger.info("No sponsors configured, skipping...");
    return;
  }

  try {
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

      await db
        .insert(sponsors)
        .values({
          id: sponsorConfig.id,
          ...sponsor,
        })
        .onConflictDoUpdate({
          target: sponsors.id,
          set: sponsor,
        });

      logger.info(`✓ Seeded sponsor: ${sponsorConfig.name}`);
    }

    for (const sponsorConfig of sponsorConfigs) {
      const tripSponsorData: Omit<TripSponsor, "id" | "createdAt"> = {
        tripId,
        sponsorId: sponsorConfig.id,
      };

      await db
        .insert(tripSponsors)
        .values(tripSponsorData)
        .onConflictDoUpdate({
          target: [tripSponsors.tripId, tripSponsors.sponsorId],
          set: tripSponsorData,
        });

      logger.info(`✓ Associated sponsor ${sponsorConfig.name} with trip`);
    }

    logger.info("✓ Sponsors seeding completed");
  } catch (error) {
    logger.error(error, "✗ Failed to seed sponsors");
    throw error;
  }
};
