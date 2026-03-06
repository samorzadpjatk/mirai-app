import { createDb } from "@integral-2025-app/db";
import type { TripResource, TripInsurance, TripInsuranceStep } from "@integral-2025-app/db";
import type { SeedEnv, TripInfoConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { supabase } from "./config/supabase";
import { env } from "./config/env";
import { readFile } from "./utils/fs";
import { assetsRoot } from "./constants";

export const loadTripInfoConfig = async (envRoot: string, infoPath: string): Promise<TripInfoConfig> => {
  const infoConfigPath = joinPath(envRoot, infoPath);
  const content = await readTextFile(infoConfigPath);
  const parsed = yaml.parse(content) as TripInfoConfig;
  return parsed || { resources: [] };
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
          
          if (resourceConfig.storagePath.startsWith("files-public/")) {
            bucketName = env.publicBucket;
            objectPath = resourceConfig.storagePath.replace("files-public/", "");
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
          
          const file = readFile(filePath);
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(objectPath, file, {
              upsert: true,
            });
            
          if (uploadError) {
            console.warn(`✗ Failed to upload file ${resourceConfig.storagePath}: ${uploadError.message}`);
          } else {
            console.log(`✓ Uploaded file: ${resourceConfig.storagePath}`);
            
            // Get public URL for public bucket files
            if (bucketName === env.publicBucket) {
              const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(objectPath);
              publicUrl = publicUrlData.publicUrl;
            }
          }
        } catch (fileError) {
          console.warn(`✗ Failed to process file ${resourceConfig.storagePath}:`, fileError);
        }
      }

      const resource: Omit<TripResource, "id" | "createdAt" | "updatedAt"> = {
        tripId,
        type: resourceConfig.type,
        label: resourceConfig.label,
        description: resourceConfig.description ?? null,
        url: resourceConfig.url ?? publicUrl ?? null,
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
