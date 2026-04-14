/**
 * RewardId - Branded type for reward identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a RewardId is expected
 */
import { createBrandedId, type BrandedId } from "../utils/branded-id";

// Custom validation for RewardId (flexible CUID or UUID)
const isValidRewardId = (id: string): boolean => {
  const CUID_REGEX = /^c[\w]+$/;
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
};

export const RewardId = createBrandedId("RewardId", {
  validate: isValidRewardId,
});
export type RewardId = BrandedId<"RewardId">;
