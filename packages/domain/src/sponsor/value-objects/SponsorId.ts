import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// Sponsor uses CUID
export const SponsorId = createBrandedId("SponsorId", {
  validate: isValidCUID,
});
export type SponsorId = BrandedId<"SponsorId">;
