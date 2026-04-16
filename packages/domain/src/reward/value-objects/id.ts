import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * RewardId - Branded type for reward identifiers
 *
 * Prevents mixing reward IDs with other entity IDs.
 */
export const Id = createBrandedId("RewardId", { validate: isValidUUID });
export type Id = BrandedId<"RewardId">;
export type RewardId = Id;

/**
 * PurchaseId - Branded type for reward purchase identifiers
 *
 * Prevents mixing purchase IDs with other entity IDs.
 */
export const PurchaseId = createBrandedId("PurchaseId", {
  validate: isValidUUID,
});
export type PurchaseId = BrandedId<"PurchaseId">;
