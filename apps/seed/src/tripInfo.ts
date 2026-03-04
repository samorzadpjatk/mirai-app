import { createDb } from "@integral-2025-app/db";
import type { TripResource, TripInsurance, TripInsuranceStep } from "@integral-2025-app/db";
import type { SeedEnv, TripInfoConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

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
      const resource: Omit<TripResource, "id" | "createdAt" | "updatedAt"> = {
        tripId,
        type: resourceConfig.type,
        label: resourceConfig.label,
        description: resourceConfig.description ?? null,
        url: resourceConfig.url ?? null,
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
