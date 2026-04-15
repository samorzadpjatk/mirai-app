import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

/**
 * RewardId - Branded type for reward identifiers
 *
 * Prevents mixing reward IDs with other entity IDs.
 */
export const Id = createBrandedId("RewardId", { validate: isValidUUID });
export type Id = BrandedId<"RewardId">;
