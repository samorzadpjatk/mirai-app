import { logger } from "@mirai-app/common/utils";
import type { TripInsurance, TripInsuranceStep } from "@mirai-app/db";
import {
  tripInsuranceSteps,
  tripInsurances,
  tripResourceFiles,
  tripResourceIcons,
  tripResourceLinks,
  tripResourceTexts,
} from "@mirai-app/db";
import type { BunFile } from "bun";
import { eq, inArray } from "drizzle-orm";
import yaml from "yaml";
import { db } from "./config/db";
import { env } from "./config/env";
import { supabase } from "./config/supabase";
import { assetsRoot } from "./constants";
import type { SeedEnv, TripInfoConfig, TripResourceConfig } from "./types";
import { readFile, readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

function isTripResourceConfig(value: unknown): value is TripResourceConfig {
  if (typeof value !== "object" || value === null) return false;
  const resource = value as Record<string, unknown>;
  return typeof resource.type === "string" && typeof resource.label === "string";
}

function isTripInfoConfig(value: unknown): value is TripInfoConfig {
  if (typeof value !== "object" || value === null) return false;
  const info = value as Record<string, unknown>;
  if (!Array.isArray(info.resources)) return false;
  return info.resources.every(isTripResourceConfig);
}

export const loadTripInfoConfig = async (
  envRoot: string,
  infoPath: string,
): Promise<TripInfoConfig> => {
  const infoConfigPath = joinPath(envRoot, infoPath);
  const content = await readTextFile(infoConfigPath);
  const parsed: unknown = yaml.parse(content);
  if (isTripInfoConfig(parsed)) {
    return parsed;
  }
  return { resources: [] };
};

export const seedTripInfo = async (
  _databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  infoConfig: TripInfoConfig,
): Promise<void> => {
  logger.info("Seeding trip info...");

  if (!infoConfig || infoConfig.resources.length === 0) {
    logger.info("No trip info configured, skipping...");
    return;
  }

  try {
    await db.delete(tripResourceLinks).where(eq(tripResourceLinks.tripId, tripId));
    await db.delete(tripResourceFiles).where(eq(tripResourceFiles.tripId, tripId));
    await db.delete(tripResourceTexts).where(eq(tripResourceTexts.tripId, tripId));
    await db.delete(tripResourceIcons).where(eq(tripResourceIcons.tripId, tripId));

    for (const resourceConfig of infoConfig.resources) {
      let publicUrl = resourceConfig.publicUrl;
      if (resourceConfig.storagePath && !publicUrl) {
        try {
          const envRoot = joinPath(assetsRoot, seedEnv);
          const filePath = joinPath(envRoot, resourceConfig.storagePath);

          let bucketName: string;
          let objectPath: string;

          if (resourceConfig.storagePath.startsWith("public/")) {
            bucketName = env.publicBucket;
            objectPath = resourceConfig.storagePath.replace("public/", "");
          } else if (resourceConfig.storagePath.startsWith("images/")) {
            bucketName = env.imageBucket;
            objectPath = resourceConfig.storagePath.replace("images/", "");
          } else if (resourceConfig.storagePath.startsWith("videos/")) {
            bucketName = env.videoBucket;
            objectPath = resourceConfig.storagePath.replace("videos/", "");
          } else {
            logger.warn(`✗ Unknown storage path format: ${resourceConfig.storagePath}`);
            bucketName = env.publicBucket;
            objectPath = resourceConfig.storagePath;
          }

          const file: BunFile = readFile(filePath);
          const uploadResult = await supabase.storage.from(bucketName).upload(objectPath, file, {
            upsert: true,
          });

          if (uploadResult.error) {
            logger.warn(
              `✗ Failed to upload file ${resourceConfig.storagePath}: ${uploadResult.error.message}`,
            );
          } else {
            logger.info(`✓ Uploaded file: ${resourceConfig.storagePath}`);

            if (bucketName === env.publicBucket) {
              const publicUrlResult = supabase.storage.from(bucketName).getPublicUrl(objectPath);
              publicUrl = publicUrlResult.data.publicUrl;
            }
          }
        } catch (fileError: unknown) {
          const error = fileError instanceof Error ? fileError : new Error(String(fileError));
          logger.warn(error, `✗ Failed to process file ${resourceConfig.storagePath}`);
        }
      }

      const sortOrder = resourceConfig.sortOrder ?? 0;

      if (resourceConfig.url || publicUrl) {
        await db.insert(tripResourceLinks).values({
          tripId,
          label: resourceConfig.label,
          type: resourceConfig.type,
          url: resourceConfig.url ?? publicUrl ?? "",
          description: resourceConfig.description ?? "",
          sortOrder,
        });
      } else if (resourceConfig.storagePath) {
        await db.insert(tripResourceFiles).values({
          tripId,
          label: resourceConfig.label,
          type: resourceConfig.type,
          storagePath: resourceConfig.storagePath,
          fileName: resourceConfig.fileName ?? "",
          publicUrl: publicUrl ?? "",
          sortOrder,
        });
      } else if (resourceConfig.value) {
        await db.insert(tripResourceTexts).values({
          tripId,
          label: resourceConfig.label,
          type: resourceConfig.type,
          value: resourceConfig.value,
          sortOrder,
        });
      } else if (resourceConfig.iconName) {
        await db.insert(tripResourceIcons).values({
          tripId,
          label: resourceConfig.label,
          type: resourceConfig.type,
          iconName: resourceConfig.iconName,
          sortOrder,
        });
      }

      logger.info(`✓ Seeded resource: ${resourceConfig.label} (${resourceConfig.type})`);
    }

    if (infoConfig.insurance) {
      const insuranceIds = await db
        .select({ id: tripInsurances.id })
        .from(tripInsurances)
        .where(eq(tripInsurances.tripId, tripId));
      if (insuranceIds.length > 0) {
        await db.delete(tripInsuranceSteps).where(
          inArray(
            tripInsuranceSteps.insuranceId,
            insuranceIds.map((i) => i.id),
          ),
        );
      }
      await db.delete(tripInsurances).where(eq(tripInsurances.tripId, tripId));

      const insurance: Omit<TripInsurance, "id" | "createdAt" | "updatedAt"> = {
        tripId,
        label: infoConfig.insurance.label,
        phoneNumber: infoConfig.insurance.phoneNumber,
        phoneDisplay: infoConfig.insurance.phoneDisplay,
        policyNumber: infoConfig.insurance.policyNumber,
        contractNumber: infoConfig.insurance.contractNumber,
        providerName: infoConfig.insurance.providerName,
        hospitalName: infoConfig.insurance.hospitalName ?? null,
        hospitalAddress: infoConfig.insurance.hospitalAddress ?? null,
        hospitalDistance: infoConfig.insurance.hospitalDistance ?? null,
      };

      const created = await db.insert(tripInsurances).values(insurance).returning();
      const createdInsurance = created[0];

      if (!createdInsurance) {
        throw new Error("Failed to create trip insurance");
      }

      logger.info(`✓ Seeded insurance: ${infoConfig.insurance.label}`);

      for (const stepConfig of infoConfig.insurance.steps) {
        const step: Omit<TripInsuranceStep, "id" | "createdAt" | "updatedAt"> = {
          insuranceId: createdInsurance.id,
          stepNumber: stepConfig.stepNumber,
          title: stepConfig.title,
          text: stepConfig.text,
          requiredInfo: stepConfig.requiredInfo ?? [],
          exampleCall: stepConfig.exampleCall ?? null,
          additionalText: stepConfig.additionalText ?? null,
        };

        await db.insert(tripInsuranceSteps).values(step);

        logger.info(`✓ Seeded insurance step: ${stepConfig.title}`);
      }
    }

    logger.info("✓ Trip info seeding completed");
  } catch (error) {
    logger.error(error, "✗ Failed to seed trip info");
    throw error;
  }
};
