import { z } from "zod";

export const REWARD_IMAGE_SIGNED_URL_SECONDS = 60 * 10;

export const rewardPurchaseStatusSchema = z.enum([
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
]);

export const userRewardPurchaseStatusSchema = z.enum(["IN_DELIVERY", "CANCELLED"]);

export type RewardPurchaseStatus = z.infer<typeof rewardPurchaseStatusSchema>;
