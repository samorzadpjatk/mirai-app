import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

/**
 * NotificationId - Branded type for notification identifiers
 *
 * Prevents mixing notification IDs with other entity IDs.
 */
export const Id = createBrandedId("NotificationId", { validate: isValidUUID });
export type Id = BrandedId<"NotificationId">;
