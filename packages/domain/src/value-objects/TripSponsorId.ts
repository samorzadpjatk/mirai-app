/**
 * TripSponsorId - Branded type for trip-sponsor association identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import { createBrandedId, type BrandedId } from "../utils/branded-id";

export const TripSponsorId = createBrandedId("TripSponsorId", {
  validate: (id) => id?.trim() !== "",
  errorMessage: "Invalid TripSponsorId: empty or undefined",
});
export type TripSponsorId = BrandedId<"TripSponsorId">;
