/**
 * SubmissionId - Branded type for challenge submission identifiers
 */
import {
  createBrandedId,
  isValidCUID,
  type BrandedId,
} from "../utils/branded-id";

export const SubmissionId = createBrandedId("SubmissionId", {
  validate: isValidCUID,
});
export type SubmissionId = BrandedId<"SubmissionId">;
