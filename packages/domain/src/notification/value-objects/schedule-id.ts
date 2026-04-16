/**
 * ScheduleId - Branded type for notification schedule identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a NotificationScheduleId is expected
 */
import { isValidUUID } from "../../system/utils/validation";
import { createBrandedId, type BrandedId } from "../../system/utils/branded-id";

export const ScheduleId = createBrandedId("NotificationScheduleId", {
  validate: isValidUUID,
});
export type ScheduleId = BrandedId<"NotificationScheduleId">;
export type NotificationScheduleId = ScheduleId;
