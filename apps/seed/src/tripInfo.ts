import { serverLogger } from "@mirai-app/shared";
import type { SeedEnv, TripInfoConfig } from "./types";
import yaml from "yaml";
import { readTextFile, readFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { getSupabaseClient } from "./config/supabase";
import { env } from "./config/env";
import { assetsRoot } from "./constants";
import {
  executeGraphQL,
  ClearTripResourcesDocument,
  CreateTripResourceDocument,
  ClearTripInsuranceDocument,
  CreateTripInsuranceDocument,
  CreateInsuranceStepDocument,
} from "./graphql-executor";

export const loadTripInfoConfig = async (
  envRoot: string,
  infoPath: string,
): Promise<TripInfoConfig> => {
  const infoConfigPath = joinPath(envRoot, infoPath);
  const content = await readTextFile(infoConfigPath);
  const parsed = yaml.parse(content) as TripInfoConfig;
  return parsed || { resources: [] };
};

export const seedTripInfo = async (
  _databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  infoConfig: TripInfoConfig,
): Promise<void> => {
  serverLogger.info("Seeding trip info...");

  if (!infoConfig?.resources?.length) {
    serverLogger.info("No trip info configured, skipping...");
    return;
  }

  // Clear existing trip resources
  await executeGraphQL(ClearTripResourcesDocument, { tripId });

  // Create resources
  for (const resourceConfig of infoConfig.resources) {
    const publicUrl = await uploadResourceFile(resourceConfig, seedEnv);

    const result = await executeGraphQL(CreateTripResourceDocument, {
      tripId,
      type: resourceConfig.type,
      label: resourceConfig.label,
      description: resourceConfig.description,
      url: resourceConfig.url ?? publicUrl ?? undefined,
      storagePath: resourceConfig.storagePath,
      fileName: resourceConfig.fileName,
      iconName: resourceConfig.iconName,
      value: resourceConfig.value,
      sortOrder: resourceConfig.sortOrder ?? 0,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (result && (result as any).createTripResource) {
      serverLogger.info(
        `✓ Seeded resource: ${resourceConfig.label} (${resourceConfig.type})`,
      );
    }
  }

  // Handle insurance if present
  if (infoConfig.insurance) {
    await executeGraphQL(ClearTripInsuranceDocument, { tripId });

    const insuranceResult = await executeGraphQL(CreateTripInsuranceDocument, {
      tripId,
      label: infoConfig.insurance.label,
      phoneNumber: infoConfig.insurance.phoneNumber,
      phoneDisplay: infoConfig.insurance.phoneDisplay,
      policyNumber: infoConfig.insurance.policyNumber,
      contractNumber: infoConfig.insurance.contractNumber,
      providerName: infoConfig.insurance.providerName,
      hospitalName: infoConfig.insurance.hospitalName,
      hospitalAddress: infoConfig.insurance.hospitalAddress,
      hospitalDistance: infoConfig.insurance.hospitalDistance,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insurance =
      insuranceResult && (insuranceResult as any).createTripInsurance;
    if (insurance) {
      serverLogger.info(`✓ Seeded insurance: ${infoConfig.insurance.label}`);

      for (const stepConfig of infoConfig.insurance.steps) {
        const stepResult = await executeGraphQL(CreateInsuranceStepDocument, {
          insuranceId: insurance.id,
          stepNumber: stepConfig.stepNumber,
          title: stepConfig.title,
          text: stepConfig.text,
          requiredInfo: stepConfig.requiredInfo,
          exampleCall: stepConfig.exampleCall,
          additionalText: stepConfig.additionalText,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (stepResult && (stepResult as any).createInsuranceStep) {
          serverLogger.info(`✓ Seeded insurance step: ${stepConfig.title}`);
        }
      }
    }
  }

  serverLogger.info("✓ Trip info seeding completed");
};

async function uploadResourceFile(
  resourceConfig: TripInfoConfig["resources"][0],
  seedEnv: SeedEnv,
): Promise<string | null> {
  if (!resourceConfig.storagePath || resourceConfig.publicUrl) {
    return resourceConfig.publicUrl ?? null;
  }

  try {
    const client = getSupabaseClient();
    const envRoot = joinPath(assetsRoot, seedEnv);
    const filePath = joinPath(envRoot, resourceConfig.storagePath);

    // Determine bucket and object path
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
      serverLogger.warn(
        `Unknown storage path format: ${resourceConfig.storagePath}`,
      );
      bucketName = env.publicBucket;
      objectPath = resourceConfig.storagePath;
    }

    const file = readFile(filePath);
    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(objectPath, file, { upsert: true });

    if (uploadError) {
      serverLogger.warn(
        `Failed to upload file ${resourceConfig.storagePath}: ${uploadError.message}`,
      );
      return null;
    }

    serverLogger.info(`✓ Uploaded file: ${resourceConfig.storagePath}`);

    // Get public URL for public bucket files
    if (bucketName === env.publicBucket) {
      const { data: publicUrlData } = client.storage
        .from(bucketName)
        .getPublicUrl(objectPath);
      return publicUrlData.publicUrl;
    }

    return null;
  } catch (fileError) {
    serverLogger.warn(`Failed to process file ${resourceConfig.storagePath}:`, {
      error: fileError,
    });
    return null;
  }
}
