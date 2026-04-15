/**
 * GroupId - Branded type for group identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a TripId where a GroupId is expected
 */
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const GroupId = createBrandedId("GroupId", { validate: isValidUUID });
export type GroupId = BrandedId<"GroupId">;
