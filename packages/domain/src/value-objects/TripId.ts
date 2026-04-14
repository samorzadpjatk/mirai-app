/**
 * TripId - Branded type for trip identifiers
 */
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const TripId = createBrandedId("TripId", { validate: isValidUUID });
export type TripId = BrandedId<"TripId">;
