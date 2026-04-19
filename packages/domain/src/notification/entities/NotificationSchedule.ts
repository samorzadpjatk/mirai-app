import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";
import type { NotificationScheduleId } from "../value-objects/NotificationId";

/**
 * NotificationSchedule entity interface
 * Represents a scheduled notification configuration
 */
export interface NotificationSchedule {
  id: NotificationScheduleId;
  name: string;
  tripId: TripId;
  notificationType: string;
  notificationTitle: string;
  notificationBody: string;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  lastRun: Date | null;
  createdById: UserId;
  createdAt: Date;
  updatedAt: Date;
}
