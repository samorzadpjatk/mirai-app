/**
 * ChallengeId - Branded type for challenge identifiers
 */
import {
  createBrandedId,
  isValidCUID,
  type BrandedId,
} from "../utils/branded-id";

export const ChallengeId = createBrandedId("ChallengeId", {
  validate: isValidCUID,
});
export type ChallengeId = BrandedId<"ChallengeId">;
