import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { env } from "./config/env";
import type { RewardConfig, AuthUserByEmail } from "./types";

const SERVICE_ROLE_KEY = env.serviceRoleKey;
const GRAPHQL_ENDPOINT = env.graphqlEndpoint;

export const loadRewardConfigs = async (
  envRoot: string,
  rewardsPath: string,
): Promise<RewardConfig[]> => {
  const fullPath = joinPath(envRoot, rewardsPath);
  const content = await readTextFile(fullPath);
  const parsed = yaml.parse(content) as RewardConfig[];

  if (!Array.isArray(parsed)) {
    throw new Error(`Rewards config must be an array: ${fullPath}`);
  }

  return parsed.filter(
    (reward) =>
      reward?.name &&
      reward?.description &&
      typeof reward?.availableQuantity === "number" &&
      typeof reward?.coinCost === "number",
  );
};

export const seedRewards = async (
  rewardConfigs: RewardConfig[],
  tripId: string,
  authUsers: AuthUserByEmail,
) => {
  // Find a valid user to create rewards (prefer admin/moderator)
  let creatorUserId: string | null = null;

  for (const [email, authUser] of authUsers.entries()) {
    // Query user via GraphQL
    const user = await findUserByAuthId(authUser.id);
    if (user) {
      if (user.role === "ADMIN" || user.role === "MODERATOR") {
        creatorUserId = user.id;
        break;
      }
      if (!creatorUserId) {
        creatorUserId = user.id;
      }
    }
  }

  if (!creatorUserId) {
    console.warn("No valid database user found to create rewards");
    return;
  }

  console.log(`Using user ${creatorUserId} to create rewards`);

  for (const rewardConfig of rewardConfigs) {
    try {
      // Map image path to storage path if provided
      let imageUrl = rewardConfig.image;
      if (imageUrl && !imageUrl.startsWith("rewards/")) {
        imageUrl = `rewards/${imageUrl.split("/").pop()}`;
      }

      // Create reward via GraphQL
      const reward = await createRewardViaGraphQL({
        tripId,
        name: rewardConfig.name,
        description: rewardConfig.description,
        type: "PHYSICAL", // Default type
        cost: rewardConfig.coinCost,
        quantity: rewardConfig.availableQuantity,
        imageUrl: imageUrl || undefined,
      });

      if (reward) {
        console.log(`✓ Created reward: ${rewardConfig.name}`);
      } else {
        console.warn(`✗ Failed to create reward: ${rewardConfig.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to create reward ${rewardConfig.name}:`, error);
    }
  }
};

// =============================================================================
// GraphQL Operations
// =============================================================================

async function findUserByAuthId(authUserId: string) {
  const query = `
    query FindUserByAuthId($authUserId: String!) {
      users(filter: { authUserId: $authUserId }) {
        id
        role
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
        variables: { authUserId },
      }),
    });

    const result = (await response.json()) as {
      data?: { users: Array<{ id: string; role: string }> };
    };

    return result.data?.users?.[0] ?? null;
  } catch {
    return null;
  }
}

async function createRewardViaGraphQL(input: {
  tripId: string;
  name: string;
  description: string;
  type: string;
  cost: number;
  quantity: number;
  imageUrl?: string;
}) {
  const query = `
    mutation CreateReward(
      $tripId: ID!
      $name: String!
      $description: String
      $type: String!
      $cost: Int
      $quantity: Int
      $imageUrl: String
    ) {
      createReward(
        input: {
          tripId: $tripId
          name: $name
          description: $description
          type: $type
          cost: $cost
          quantity: $quantity
          imageUrl: $imageUrl
        }
      ) {
        id
        tripId
        name
        description
        type
        cost
        quantity
        imageUrl
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
        createReward: {
          id: string;
          tripId: string;
          name: string;
          description: string;
          type: string;
          cost?: number;
          quantity?: number;
          imageUrl?: string;
          createdAt: string;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (result.errors) {
      console.warn("GraphQL errors:", result.errors);
      return null;
    }

    return result.data?.createReward ?? null;
  } catch (error) {
    console.error("Failed to create reward:", error);
    return null;
  }
}
