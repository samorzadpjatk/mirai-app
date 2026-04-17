import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// Reward uses CUID
export const RewardId = createBrandedId("RewardId", { validate: isValidCUID });
export type RewardId = BrandedId<"RewardId">;

// RewardPurchase uses CUID
export const RewardPurchaseId = createBrandedId("RewardPurchaseId", {
  validate: isValidCUID,
});
export type RewardPurchaseId = BrandedId<"RewardPurchaseId">;
