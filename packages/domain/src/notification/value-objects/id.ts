import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

/**
 * NotificationId - Branded type for notification identifiers
 *
 * Prevents mixing notification IDs with other entity IDs.
 */
export const Id = createBrandedId("NotificationId", { validate: isValidUUID });
export type Id = BrandedId<"NotificationId">;
export type NotificationId = Id;
