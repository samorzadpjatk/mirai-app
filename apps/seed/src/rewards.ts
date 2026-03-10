import yaml from "yaml";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";
import { createDb } from "@mirai-app/db";
import { env } from "./config/env";
import type { RewardConfig, AuthUserByEmail } from "./types";

const db = createDb(env.databaseUrl);

export const loadRewardConfigs = async (envRoot: string, rewardsPath: string): Promise<RewardConfig[]> => {
  const fullPath = joinPath(envRoot, rewardsPath);
  const content = await readTextFile(fullPath);
  const parsed = yaml.parse(content) as RewardConfig[];
  
  if (!Array.isArray(parsed)) {
    throw new Error(`Rewards config must be an array: ${fullPath}`);
  }
  
  return parsed.filter(reward => 
    reward?.name && 
    reward?.description && 
    typeof reward?.availableQuantity === 'number' && 
    typeof reward?.coinCost === 'number'
  );
};

export const seedRewards = async (
  rewardConfigs: RewardConfig[],
  tripId: string,
  authUsers: AuthUserByEmail
) => {
  // Find a valid user from the database to create rewards
  // First try to find an admin user, then any user
  let dbUser = null;
  
  for (const [email, authUser] of authUsers.entries()) {
    try {
      const user = await db.user.findFirst({ 
        where: { authUserId: authUser.id },
        select: { id: true, role: true }
      });
      
      if (user) {
        // Prefer admin or moderator users
        if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
          dbUser = user;
          break;
        }
        // Use first available user if no admin found
        if (!dbUser) {
          dbUser = user;
        }
      }
    } catch (error) {
      // Continue trying other users
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
      // Map image path to storage path if provided
      let imagePath = rewardConfig.image;
      if (imagePath && !imagePath.startsWith('rewards/')) {
        imagePath = `rewards/${imagePath.split('/').pop()}`;
      }

      await db.reward.create({
        data: {
          name: rewardConfig.name,
          description: rewardConfig.description,
          availableQuantity: rewardConfig.availableQuantity,
          coinCost: rewardConfig.coinCost,
          image: imagePath || null,
          tripId,
          createdById: dbUser.id,
        },
      });

      console.log(`✓ Created reward: ${rewardConfig.name}`);
    } catch (error) {
      console.error(`✗ Failed to create reward ${rewardConfig.name}:`, error);
    }
  }
};
