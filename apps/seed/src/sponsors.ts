import { logger } from "@mirai-app/common/utils";
import type { Sponsor, TripSponsor, TripSponsorDisplay } from "@mirai-app/db";
import { sponsors, tripSponsorDisplay, tripSponsors } from "@mirai-app/db";
import { and, eq, notInArray } from "drizzle-orm";
import yaml from "yaml";
import { db } from "./config/db";
import type { SeedEnv, SponsorConfig } from "./types";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

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
  _databaseUrl: string,
  tripId: string,
  _seedEnv: SeedEnv,
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

    for (const sponsorConfig of sponsorConfigs) {
      const displayData: Omit<TripSponsorDisplay, "id"> = {
        tripId,
        sponsorId: sponsorConfig.id,
        height: sponsorConfig.height ?? 0,
        offsetX: sponsorConfig.offsetX ?? 0,
        offsetY: sponsorConfig.offsetY ?? 0,
      };

      await db
        .insert(tripSponsorDisplay)
        .values(displayData)
        .onConflictDoUpdate({
          target: [tripSponsorDisplay.tripId, tripSponsorDisplay.sponsorId],
          set: displayData,
        });

      logger.info(`✓ Seeded sponsor display for ${sponsorConfig.name}`);
    }

    // The YAML is the only way a sponsor reaches a trip — there is no admin UI —
    // so it is the source of truth. Without this, a sponsor dropped from the
    // config keeps its association forever and still renders on the trip screen,
    // which is how four retired demo partners survived alongside the real one.
    // Only the trip association and its layout are removed; the sponsor row
    // itself stays, because other trips may still reference it.
    const configuredIds = sponsorConfigs.map((sponsorConfig) => sponsorConfig.id);

    const removedDisplays = await db
      .delete(tripSponsorDisplay)
      .where(
        and(
          eq(tripSponsorDisplay.tripId, tripId),
          notInArray(tripSponsorDisplay.sponsorId, configuredIds),
        ),
      )
      .returning({ sponsorId: tripSponsorDisplay.sponsorId });

    const removed = await db
      .delete(tripSponsors)
      .where(
        and(eq(tripSponsors.tripId, tripId), notInArray(tripSponsors.sponsorId, configuredIds)),
      )
      .returning({ sponsorId: tripSponsors.sponsorId });

    for (const row of removed) {
      logger.info(`✓ Removed stale sponsor association: ${row.sponsorId}`);
    }
    if (removedDisplays.length > 0) {
      logger.info(`✓ Removed ${removedDisplays.length} stale sponsor display row(s)`);
    }

    logger.info("✓ Sponsors seeding completed");
  } catch (error) {
    logger.error(error, "✗ Failed to seed sponsors");
    throw error;
  }
};
