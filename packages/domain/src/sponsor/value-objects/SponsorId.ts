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

// TripSponsor uses CUID
export const TripSponsorId = createBrandedId("TripSponsorId", {
  validate: isValidCUID,
});
export type TripSponsorId = BrandedId<"TripSponsorId">;
