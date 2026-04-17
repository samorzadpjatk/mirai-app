import {
  createBrandedId,
  type BrandedId,
  isValidCUID,
} from "../../shared/value-objects/branded-id";

// Trip uses CUID
export const TripId = createBrandedId("TripId", { validate: isValidCUID });
export type TripId = BrandedId<"TripId">;
