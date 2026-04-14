/**
 * NotificationId - Branded type for notification identifiers
 */
import { createBrandedId, type BrandedId } from "../utils/branded-id";

// Custom validation for NotificationId (CUID or UUID)
const isValidCUIDOrUUID = (id: string): boolean => {
  const CUID_REGEX = /^c[abcdefghijklmnopqrstuvwxyz0123456789]{24}$/;
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
};

export const NotificationId = createBrandedId("NotificationId", {
  validate: isValidCUIDOrUUID,
});
export type NotificationId = BrandedId<"NotificationId">;
