/**
 * ReportId - Branded type for submission report identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

export const ReportId = createBrandedId("ReportId", {
  validate: (id) => id?.trim() !== "",
  errorMessage: "Invalid ReportId: empty or undefined",
});
export type ReportId = BrandedId<"ReportId">;
