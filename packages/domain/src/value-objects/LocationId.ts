/**
 * LocationId - Branded type for location identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a LocationId is expected
 */
import {
  createBrandedId,
  isValidCUID,
  type BrandedId,
} from "../utils/branded-id";

export const LocationId = createBrandedId("LocationId", {
  validate: isValidCUID,
});
export type LocationId = BrandedId<"LocationId">;
