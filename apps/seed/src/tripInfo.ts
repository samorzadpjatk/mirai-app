import type { SeedEnv, TripInfoConfig } from "./types";
import yaml from "yaml";
import { readTextFile, readFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { getSupabaseClient } from "./config/supabase";
import { env } from "./config/env";
import { assetsRoot } from "./constants";

const SERVICE_ROLE_KEY = env.serviceRoleKey;
const GRAPHQL_ENDPOINT = env.graphqlEndpoint;

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
  databaseUrl: string,
  tripId: string,
  seedEnv: SeedEnv,
  infoConfig: TripInfoConfig,
): Promise<void> => {
  console.log("Seeding trip info...");

  if (!infoConfig || infoConfig.resources.length === 0) {
    console.log("No trip info configured, skipping...");
    return;
  }

  try {
    // Clear existing trip resources via GraphQL
    await clearTripResources(tripId);

    // Create resources
    for (const resourceConfig of infoConfig.resources) {
      // Handle file upload if storagePath is specified
      let publicUrl = resourceConfig.publicUrl;
      if (resourceConfig.storagePath && !publicUrl) {
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
            console.warn(
              `✗ Unknown storage path format: ${resourceConfig.storagePath}`,
            );
            bucketName = env.publicBucket;
            objectPath = resourceConfig.storagePath;
          }

          const file = readFile(filePath);
          const { error: uploadError } = await client.storage
            .from(bucketName)
            .upload(objectPath, file, {
              upsert: true,
            });

          if (uploadError) {
            console.warn(
              `✗ Failed to upload file ${resourceConfig.storagePath}: ${uploadError.message}`,
            );
          } else {
            console.log(`✓ Uploaded file: ${resourceConfig.storagePath}`);

            // Get public URL for public bucket files
            if (bucketName === env.publicBucket) {
              const { data: publicUrlData } = client.storage
                .from(bucketName)
                .getPublicUrl(objectPath);
              publicUrl = publicUrlData.publicUrl;
            }
          }
        } catch (fileError) {
          console.warn(
            `✗ Failed to process file ${resourceConfig.storagePath}:`,
            fileError,
          );
        }
      }

      // Create resource via GraphQL
      const resource = await createTripResourceViaGraphQL({
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

      if (resource) {
        console.log(
          `✓ Seeded resource: ${resourceConfig.label} (${resourceConfig.type})`,
        );
      }
    }

    // Handle insurance if present
    if (infoConfig.insurance) {
      // Clear existing insurance via GraphQL
      await clearTripInsurance(tripId);

      // Create insurance
      const insurance = await createTripInsuranceViaGraphQL({
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

      if (insurance) {
        console.log(`✓ Seeded insurance: ${infoConfig.insurance.label}`);

        // Create insurance steps
        for (const stepConfig of infoConfig.insurance.steps) {
          const step = await createInsuranceStepViaGraphQL({
            insuranceId: insurance.id,
            stepNumber: stepConfig.stepNumber,
            title: stepConfig.title,
            text: stepConfig.text,
            requiredInfo: stepConfig.requiredInfo,
            exampleCall: stepConfig.exampleCall,
            additionalText: stepConfig.additionalText,
          });

          if (step) {
            console.log(`✓ Seeded insurance step: ${stepConfig.title}`);
          }
        }
      }
    }

    console.log("✓ Trip info seeding completed");
  } catch (error) {
    console.error("✗ Failed to seed trip info:", error);
    throw error;
  }
};

// =============================================================================
// GraphQL Operations
// =============================================================================

async function clearTripResources(tripId: string) {
  const mutation = `
    mutation ClearTripResources($tripId: ID!) {
      deleteTripResources(where: { tripId: $tripId }) {
        count
      }
    }
  `;

  try {
    await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { tripId },
      }),
    });
  } catch (error) {
    console.warn("Failed to clear trip resources:", error);
  }
}

async function createTripResourceViaGraphQL(input: {
  tripId: string;
  type: string;
  label: string;
  description?: string;
  url?: string;
  storagePath?: string;
  fileName?: string;
  iconName?: string;
  value?: string;
  sortOrder: number;
}) {
  const mutation = `
    mutation CreateTripResource(
      $tripId: ID!
      $type: String!
      $label: String!
      $description: String
      $url: String
      $storagePath: String
      $fileName: String
      $iconName: String
      $value: String
      $sortOrder: Int
    ) {
      createTripResource(
        input: {
          tripId: $tripId
          type: $type
          label: $label
          description: $description
          url: $url
          storagePath: $storagePath
          fileName: $fileName
          iconName: $iconName
          value: $value
          sortOrder: $sortOrder
        }
      ) {
        id
        tripId
        type
        label
        description
        url
        sortOrder
        createdAt
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query: mutation,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        createTripResource: {
          id: string;
          tripId: string;
          type: string;
          label: string;
          description?: string;
          url?: string;
          sortOrder: number;
          createdAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.createTripResource ?? null;
  } catch (error) {
    console.error("Failed to create trip resource:", error);
    return null;
  }
}

async function clearTripInsurance(tripId: string) {
  const mutation = `
    mutation ClearTripInsurance($tripId: ID!) {
      deleteTripInsurance(where: { tripId: $tripId }) {
        count
      }
    }
  `;

  try {
    await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query: mutation,
        variables: { tripId },
      }),
    });
  } catch (error) {
    console.warn("Failed to clear trip insurance:", error);
  }
}

async function createTripInsuranceViaGraphQL(input: {
  tripId: string;
  label: string;
  phoneNumber: string;
  phoneDisplay?: string;
  policyNumber?: string;
  contractNumber?: string;
  providerName?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalDistance?: string;
}) {
  const mutation = `
    mutation CreateTripInsurance(
      $tripId: ID!
      $label: String!
      $phoneNumber: String!
      $phoneDisplay: String
      $policyNumber: String
      $contractNumber: String
      $providerName: String
      $hospitalName: String
      $hospitalAddress: String
      $hospitalDistance: String
    ) {
      createTripInsurance(
        input: {
          tripId: $tripId
          label: $label
          phoneNumber: $phoneNumber
          phoneDisplay: $phoneDisplay
          policyNumber: $policyNumber
          contractNumber: $contractNumber
          providerName: $providerName
          hospitalName: $hospitalName
          hospitalAddress: $hospitalAddress
          hospitalDistance: $hospitalDistance
        }
      ) {
        id
        tripId
        label
        phoneNumber
        createdAt
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query: mutation,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        createTripInsurance: {
          id: string;
          tripId: string;
          label: string;
          phoneNumber: string;
          createdAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.createTripInsurance ?? null;
  } catch (error) {
    console.error("Failed to create trip insurance:", error);
    return null;
  }
}

async function createInsuranceStepViaGraphQL(input: {
  insuranceId: string;
  stepNumber: number;
  title: string;
  text: string;
  requiredInfo?: string[];
  exampleCall?: string;
  additionalText?: string;
}) {
  const mutation = `
    mutation CreateInsuranceStep(
      $insuranceId: ID!
      $stepNumber: Int!
      $title: String!
      $text: String!
      $requiredInfo: [String!]
      $exampleCall: String
      $additionalText: String
    ) {
      createInsuranceStep(
        input: {
          insuranceId: $insuranceId
          stepNumber: $stepNumber
          title: $title
          text: $text
          requiredInfo: $requiredInfo
          exampleCall: $exampleCall
          additionalText: $additionalText
        }
      ) {
        id
        insuranceId
        stepNumber
        title
        text
        createdAt
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "X-Service-Account": "seed",
      },
      body: JSON.stringify({
        query: mutation,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        createInsuranceStep: {
          id: string;
          insuranceId: string;
          stepNumber: number;
          title: string;
          text: string;
          createdAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.createInsuranceStep ?? null;
  } catch (error) {
    console.error("Failed to create insurance step:", error);
    return null;
  }
}
