import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// TripResource uses CUID
export const TripResourceId = createBrandedId("TripResourceId", {
  validate: isValidCUID,
});
export type TripResourceId = BrandedId<"TripResourceId">;

// TripInsurance uses CUID
export const TripInsuranceId = createBrandedId("TripInsuranceId", {
  validate: isValidCUID,
});
export type TripInsuranceId = BrandedId<"TripInsuranceId">;

// TripInsuranceStep uses CUID
export const TripInsuranceStepId = createBrandedId("TripInsuranceStepId", {
  validate: isValidCUID,
});
export type TripInsuranceStepId = BrandedId<"TripInsuranceStepId">;

// TripSponsor uses CUID
export const TripSponsorId = createBrandedId("TripSponsorId", {
  validate: isValidCUID,
});
export type TripSponsorId = BrandedId<"TripSponsorId">;
