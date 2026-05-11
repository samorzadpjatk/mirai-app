import { createDb } from "@mirai-app/db";
import type { TripResource, TripInsurance, TripInsuranceStep } from "@mirai-app/db";
import type { SeedEnv, TripInfoConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import { readFile } from "./utils/fs";
import { assetsRoot } from "./constants";

function isTripResourceConfig(value: unknown): value is import("./types").TripResourceConfig {
  if (typeof value !== 'object' || value === null) return false;
  const resource = value as Record<string, unknown>;
  return typeof resource.type === 'string' && typeof resource.label === 'string';
}

function isTripInsuranceStepConfig(value: unknown): value is import("./types").TripInsuranceStepConfig {
  if (typeof value !== 'object' || value === null) return false;
  const step = value as Record<string, unknown>;
  return (
    typeof step.stepNumber === 'number' &&
    typeof step.title === 'string' &&
    typeof step.text === 'string'
  );
}

function isTripInsuranceConfig(value: unknown): value is import("./types").TripInsuranceConfig {
  if (typeof value !== 'object' || value === null) return false;
  const insurance = value as Record<string, unknown>;
  return (
    typeof insurance.label === 'string' &&
    typeof insurance.phoneNumber === 'string' &&
    typeof insurance.policyNumber === 'string' &&
    Array.isArray(insurance.steps) &&
    insurance.steps.every(isTripInsuranceStepConfig)
  );
}

function isTripInfoConfig(value: unknown): value is TripInfoConfig {
  if (typeof value !== 'object' || value === null) return false;
  const info = value as Record<string, unknown>;
  if (!Array.isArray(info.resources)) return false;
  return info.resources.every(isTripResourceConfig);
}

export const loadTripInfoConfig = async (envRoot: string, infoPath: string): Promise<TripInfoConfig> => {
  const infoConfigPath = joinPath(envRoot, infoPath);
  const content = await readTextFile(infoConfigPath);
  const parsed: unknown = yaml.parse(content);
  if (isTripInfoConfig(parsed)) {
    return parsed;
  }
  return { resources: [] };
};

export const seedTripInfo = async (
  databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  infoConfig: TripInfoConfig
): Promise<void> => {
  const db = createDb(databaseUrl);

  console.log("Seeding trip info...");

  if (!infoConfig || infoConfig.resources.length === 0) {
    console.log("No trip info configured, skipping...");
    return;
  }

  try {
    // Delete existing resources for this trip
    await db.tripResource.deleteMany({
      where: { tripId },
    });

    // Create resources
    for (const resourceConfig of infoConfig.resources) {
      // Handle file upload if storagePath is specified
      let publicUrl = resourceConfig.publicUrl;
      if (resourceConfig.storagePath && !publicUrl) {
        try {
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
            console.warn(`✗ Unknown storage path format: ${resourceConfig.storagePath}`);
            bucketName = env.publicBucket;
            objectPath = resourceConfig.storagePath;
          }
          
          const file: BunFile = readFile(filePath);
          const uploadResult = await supabase.storage
            .from(bucketName)
            .upload(objectPath, file, {
              upsert: true,
            });
            
          if (uploadResult.error) {
            console.warn(`✗ Failed to upload file ${resourceConfig.storagePath}: ${uploadResult.error.message}`);
          } else {
            console.log(`✓ Uploaded file: ${resourceConfig.storagePath}`);
            
            // Get public URL for public bucket files
            if (bucketName === env.publicBucket) {
              const publicUrlResult = supabase.storage
                .from(bucketName)
                .getPublicUrl(objectPath);
              publicUrl = publicUrlResult.data.publicUrl;
            }
          }
        } catch (fileError: unknown) {
          const error = fileError instanceof Error ? fileError : new Error(String(fileError));
          console.warn(`✗ Failed to process file ${resourceConfig.storagePath}:`, error);
        }
      }

      const resource: Omit<TripResource, "id" | "createdAt" | "updatedAt"> = {
        tripId,
        type: resourceConfig.type,
        label: resourceConfig.label,
        description: resourceConfig.description ?? null,
        url: resourceConfig.url ?? publicUrl ?? null,
        publicUrl: publicUrl ?? null,
        storagePath: resourceConfig.storagePath ?? null,
        fileName: resourceConfig.fileName ?? null,
        iconName: resourceConfig.iconName ?? null,
        value: resourceConfig.value ?? null,
        sortOrder: resourceConfig.sortOrder ?? 0,
      };

      await db.tripResource.create({
        data: resource,
      });

      console.log(`✓ Seeded resource: ${resourceConfig.label} (${resourceConfig.type})`);
    }

    // Handle insurance if present
    if (infoConfig.insurance) {
      // Delete existing insurance for this trip
      await db.tripInsuranceStep.deleteMany({
        where: {
          insurance: {
            tripId,
          },
        },
      });
      await db.tripInsurance.deleteMany({
        where: { tripId },
      });

      // Create insurance
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

      const createdInsurance = await db.tripInsurance.create({
        data: insurance,
      });

      console.log(`✓ Seeded insurance: ${infoConfig.insurance.label}`);

      // Create insurance steps
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

        await db.tripInsuranceStep.create({
          data: step,
        });

        console.log(`✓ Seeded insurance step: ${stepConfig.title}`);
      }
    }

    console.log("✓ Trip info seeding completed");
  } catch (error) {
    console.error("✗ Failed to seed trip info:", error);
    throw error;
  }
};
