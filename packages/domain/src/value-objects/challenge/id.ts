import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

/**
 * ChallengeId - Branded type for challenge identifiers
 *
 * Prevents mixing challenge IDs with other entity IDs.
 */
export const Id = createBrandedId("ChallengeId", { validate: isValidUUID });
export type Id = BrandedId<"ChallengeId">;
