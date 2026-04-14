import { serverLogger } from "@mirai-app/shared";
import type { SponsorConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import {
  executeGraphQL,
  CreateSponsorDocument,
  FindSponsorByNameDocument,
  LinkSponsorToTripDocument,
} from "./graphql-executor";

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
  _databaseUrl: string,
  tripId: string,
  _seedEnv: string,
  sponsorConfigs: SponsorConfig[],
): Promise<void> => {
  serverLogger.info("Seeding sponsors...");

  if (sponsorConfigs.length === 0) {
    serverLogger.info("No sponsors configured, skipping...");
    return;
  }

  for (const sponsorConfig of sponsorConfigs) {
    const sponsorResult = await executeGraphQL(CreateSponsorDocument, {
      name: sponsorConfig.name,
      description: sponsorConfig.description,
      website: undefined,
      logoUrl: sponsorConfig.logoPath,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sponsor = sponsorResult && (sponsorResult as any).createSponsor;

    if (sponsor) {
      serverLogger.info(`✓ Created sponsor: ${sponsorConfig.name}`);

      const linkResult = await executeGraphQL(LinkSponsorToTripDocument, {
        sponsorId: sponsor.id,
        tripId,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (linkResult && (linkResult as any).linkSponsorToTrip) {
        serverLogger.info(
          `✓ Associated sponsor ${sponsorConfig.name} with trip`,
        );
      }
    } else {
      // Try to find existing sponsor
      const existingResult = await executeGraphQL(FindSponsorByNameDocument, {
        name: sponsorConfig.name,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = existingResult && (existingResult as any).sponsors;

      if (existing?.[0]) {
        serverLogger.info(`Found existing sponsor: ${sponsorConfig.name}`);
        const linkResult = await executeGraphQL(LinkSponsorToTripDocument, {
          sponsorId: existing[0].id,
          tripId,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (linkResult && (linkResult as any).linkSponsorToTrip) {
          serverLogger.info(
            `✓ Associated existing sponsor ${sponsorConfig.name} with trip`,
          );
        }
      } else {
        serverLogger.warn(`✗ Failed to create sponsor: ${sponsorConfig.name}`);
      }
    }
  }

  serverLogger.info("✓ Sponsors seeding completed");
};
