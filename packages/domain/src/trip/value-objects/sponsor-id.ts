/**
 * SponsorId - Branded type for trip-sponsor association identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

export const SponsorId = createBrandedId("TripSponsorId", {
  validate: (id) => id?.trim() !== "",
  errorMessage: "Invalid TripSponsorId: empty or undefined",
});
export type SponsorId = BrandedId<"TripSponsorId">;
export type TripSponsorId = SponsorId;
