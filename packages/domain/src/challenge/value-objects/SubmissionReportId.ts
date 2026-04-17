import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// SubmissionReport uses CUID
export const SubmissionReportId = createBrandedId("SubmissionReportId", {
  validate: isValidCUID,
});
export type SubmissionReportId = BrandedId<"SubmissionReportId">;
