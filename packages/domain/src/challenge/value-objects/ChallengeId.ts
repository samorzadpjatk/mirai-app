import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// Challenge uses CUID
export const ChallengeId = createBrandedId("ChallengeId", {
  validate: isValidCUID,
});
export type ChallengeId = BrandedId<"ChallengeId">;

// ChallengeSubmission uses CUID
export const ChallengeSubmissionId = createBrandedId("ChallengeSubmissionId", {
  validate: isValidCUID,
});
export type ChallengeSubmissionId = BrandedId<"ChallengeSubmissionId">;

// ChallengeVote uses CUID
export const ChallengeVoteId = createBrandedId("ChallengeVoteId", {
  validate: isValidCUID,
});
export type ChallengeVoteId = BrandedId<"ChallengeVoteId">;
