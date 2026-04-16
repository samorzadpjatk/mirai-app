/**
 * SubmissionId - Branded type for challenge submission identifiers
 */
import { isValidCUID } from "../../system/utils/branded-id";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

export const SubmissionId = createBrandedId("SubmissionId", {
  validate: isValidCUID,
});
export type SubmissionId = BrandedId<"SubmissionId">;
