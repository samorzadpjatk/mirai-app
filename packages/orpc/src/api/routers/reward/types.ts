import { z } from "zod";

export const rewardPurchaseStatusSchema = z.enum([
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
]);

export const userRewardPurchaseStatusSchema = z.enum(["IN_DELIVERY", "CANCELLED"]);

export type RewardPurchaseStatus = z.infer<typeof rewardPurchaseStatusSchema>;
