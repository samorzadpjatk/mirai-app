import { serverLogger } from "@mirai-app/shared";
import type { SponsorConfig } from "./types";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { env } from "./config/env";

const SERVICE_ROLE_KEY = env.serviceRoleKey;
const GRAPHQL_ENDPOINT = env.graphqlEndpoint;

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
  seedEnv: string,
  sponsorConfigs: SponsorConfig[],
): Promise<void> => {
  serverLogger.info("Seeding sponsors...");

  if (sponsorConfigs.length === 0) {
    serverLogger.info("No sponsors configured, skipping...");
    return;
  }

  try {
    // Create sponsors and link to trip
    for (const sponsorConfig of sponsorConfigs) {
      // Create sponsor via GraphQL
      const sponsor = await createSponsorViaGraphQL({
        name: sponsorConfig.name,
        description: sponsorConfig.description,
        website: sponsorConfig.website,
        logoUrl: sponsorConfig.logoPath,
      });

      if (sponsor) {
        serverLogger.info(`✓ Created sponsor: ${sponsorConfig.name}`);

        // Link sponsor to trip
        const linked = await linkSponsorToTripViaGraphQL({
          sponsorId: sponsor.id,
          tripId,
        });

        if (linked) {
          serverLogger.info(
            `✓ Associated sponsor ${sponsorConfig.name} with trip`,
          );
        }
      } else {
        serverLogger.warn(`✗ Failed to create sponsor: ${sponsorConfig.name}`);
      }
    }

    serverLogger.info("✓ Sponsors seeding completed");
  } catch (error) {
    serverLogger.error(
      "✗ Failed to seed sponsors:",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};

// =============================================================================
// GraphQL Operations
// =============================================================================

async function createSponsorViaGraphQL(input: {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}) {
  const query = `
    mutation CreateSponsor(
      $name: String!
      $description: String
      $website: String
      $logoUrl: String
    ) {
      createSponsor(
        input: {
          name: $name
          description: $description
          website: $website
          logoUrl: $logoUrl
        }
      ) {
        id
        name
        description
        website
        logoUrl
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
        query,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        createSponsor: {
          id: string;
          name: string;
          description?: string;
          website?: string;
          logoUrl?: string;
          createdAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      // Check if sponsor already exists
      if (
        result.errors.some((e) =>
          e.message.toLowerCase().includes("already exists"),
        )
      ) {
        // Try to find existing sponsor
        return await findSponsorByName(input.name);
      }
      serverLogger.warn("GraphQL errors:", { errors: result.errors });
      return null;
    }

    return result.data?.createSponsor ?? null;
  } catch (error) {
    serverLogger.error(
      "Failed to create sponsor:",
      error instanceof Error ? error : new Error(String(error)),
    );
    return null;
  }
}

async function findSponsorByName(name: string) {
  const query = `
    query FindSponsor($name: String!) {
      sponsors(filter: { name: $name }) {
        id
        name
        description
        website
        logoUrl
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
      },
      body: JSON.stringify({
        query,
        variables: { name },
      }),
    });

    const result = (await response.json()) as {
      data?: {
        sponsors: Array<{
          id: string;
          name: string;
          description?: string;
          website?: string;
          logoUrl?: string;
          createdAt: string;
        }>;
      };
    };

    return result.data?.sponsors?.[0] ?? null;
  } catch {
    return null;
  }
}

async function linkSponsorToTripViaGraphQL(input: {
  sponsorId: string;
  tripId: string;
}) {
  const query = `
    mutation LinkSponsorToTrip($sponsorId: ID!, $tripId: ID!) {
      linkSponsorToTrip(input: { sponsorId: $sponsorId, tripId: $tripId }) {
        id
        sponsorId
        tripId
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
        query,
        variables: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as {
      data?: {
        linkSponsorToTrip: { id: string; sponsorId: string; tripId: string };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      // Link may already exist
      if (
        result.errors.some((e) =>
          e.message.toLowerCase().includes("already exists"),
        )
      ) {
        return { id: "existing", ...input };
      }
      serverLogger.warn("GraphQL errors:", { errors: result.errors });
      return null;
    }

    return result.data?.linkSponsorToTrip ?? null;
  } catch (error) {
    console.error("Failed to link sponsor to trip:", error);
    return null;
  }
}
