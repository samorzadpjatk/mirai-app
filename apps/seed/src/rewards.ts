import { serverLogger } from "@mirai-app/shared";
import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import type { RewardConfig, AuthUserByEmail } from "./types";
import {
  executeGraphQL,
  FindUserByAuthIdDocument,
  CreateRewardDocument,
} from "./graphql-executor";

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

  for (const [_email, authUser] of authUsers.entries()) {
    const result = await executeGraphQL(FindUserByAuthIdDocument, {
      authUserId: authUser.id,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = result && (result as any).users;
    const user = users?.[0];
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
    serverLogger.warn("No valid database user found to create rewards");
    return;
  }

  serverLogger.info(`Using user ${creatorUserId} to create rewards`);

  for (const rewardConfig of rewardConfigs) {
    // Map image path to storage path if provided
    let imageUrl = rewardConfig.image;
    if (imageUrl && !imageUrl.startsWith("rewards/")) {
      imageUrl = `rewards/${imageUrl.split("/").pop()}`;
    }

    const rewardResult = await executeGraphQL(CreateRewardDocument, {
      tripId,
      name: rewardConfig.name,
      description: rewardConfig.description,
      type: "PHYSICAL",
      cost: rewardConfig.coinCost,
      quantity: rewardConfig.availableQuantity,
      imageUrl: imageUrl || undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (rewardResult && (rewardResult as any).createReward) {
      serverLogger.info(`✓ Created reward: ${rewardConfig.name}`);
    } else {
      serverLogger.warn(`✗ Failed to create reward: ${rewardConfig.name}`);
    }
  }
};
