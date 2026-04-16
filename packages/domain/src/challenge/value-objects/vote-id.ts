/**
 * VoteId - Branded type for challenge vote identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

export const VoteId = createBrandedId("ChallengeVoteId", {
  validate: (id) => id?.trim() !== "",
  errorMessage: "Invalid ChallengeVoteId: empty or undefined",
});
export type VoteId = BrandedId<"ChallengeVoteId">;
export type ChallengeVoteId = VoteId;
