import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// Location uses CUID
export const LocationId = createBrandedId("LocationId", {
  validate: isValidCUID,
});
export type LocationId = BrandedId<"LocationId">;

// LocationSharingRequest uses CUID
export const LocationSharingRequestId = createBrandedId(
  "LocationSharingRequestId",
  { validate: isValidCUID },
);
export type LocationSharingRequestId = BrandedId<"LocationSharingRequestId">;
