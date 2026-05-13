import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { db } from "./config/db";
import type { RewardConfig, AuthUserByEmail } from "./types";
import { users, rewards } from "@mirai-app/db";
import { eq } from "drizzle-orm";

function isRewardConfig(value: unknown): value is RewardConfig {
  if (typeof value !== 'object' || value === null) return false;
  const reward = value as Record<string, unknown>;
  return (
    typeof reward.name === 'string' &&
    typeof reward.description === 'string' &&
    typeof reward.availableQuantity === 'number' &&
    typeof reward.coinCost === 'number'
  );
}

export const loadRewardConfigs = async (envRoot: string, rewardsPath: string): Promise<RewardConfig[]> => {
  const fullPath = joinPath(envRoot, rewardsPath);
  const content = await readTextFile(fullPath);
  const parsed: unknown = yaml.parse(content);
  
  if (!Array.isArray(parsed)) {
    throw new Error(`Rewards config must be an array: ${fullPath}`);
  }
  
  return parsed.filter(isRewardConfig);
};

export const seedRewards = async (
  rewardConfigs: RewardConfig[],
  tripId: string,
  authUsers: AuthUserByEmail
) => {
  let dbUser = null;
  
  for (const [, authUser] of authUsers.entries()) {
    try {
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.authUserId, authUser.id),
      });
      
      if (user) {
        if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
          dbUser = user;
          break;
        }
        dbUser ??= user;
      }
    } catch {
      continue;
    }
  }
  
  if (!dbUser) {
    console.warn("No valid database user found to create rewards");
    return;
  }

  console.log(`Using user ${dbUser.id} (${dbUser.role}) to create rewards`);

  for (const rewardConfig of rewardConfigs) {
    try {
      let imagePath = rewardConfig.image;
      if (imagePath && !imagePath.startsWith('rewards/')) {
        imagePath = `rewards/${imagePath.split('/').pop()}`;
      }

      await db.insert(rewards).values({
        name: rewardConfig.name,
        description: rewardConfig.description,
        availableQuantity: rewardConfig.availableQuantity,
        coinCost: rewardConfig.coinCost,
        image: imagePath ?? null,
        tripId,
        createdById: dbUser.id,
      });

      console.log(`✓ Created reward: ${rewardConfig.name}`);
    } catch (error) {
      console.error(`✗ Failed to create reward ${rewardConfig.name}:`, error);
    }
  }
};
