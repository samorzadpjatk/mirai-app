/**
 * ScheduleId - Branded type for notification schedule identifiers
 *
 * This prevents accidentally mixing up different types of IDs
 * e.g., using a UserId where a NotificationScheduleId is expected
 */
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../../utils/branded-id";

export const ScheduleId = createBrandedId("NotificationScheduleId", {
  validate: isValidUUID,
});
export type ScheduleId = BrandedId<"NotificationScheduleId">;
