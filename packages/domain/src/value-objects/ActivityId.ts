/**
 * ActivityId - Branded type for activity identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 */
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const ActivityId = createBrandedId("ActivityId", {
  validate: isValidUUID,
});
export type ActivityId = BrandedId<"ActivityId">;
