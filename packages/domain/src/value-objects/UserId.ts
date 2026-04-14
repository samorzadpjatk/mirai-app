/**
 * UserId - Branded type for user identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a ChallengeId where a UserId is expected
 */
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const UserId = createBrandedId("UserId", { validate: isValidUUID });
export type UserId = BrandedId<"UserId">;
