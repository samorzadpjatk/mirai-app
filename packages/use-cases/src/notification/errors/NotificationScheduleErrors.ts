import { Data } from "effect";

/**
 * Notification schedule not found error
 */
export class NotificationScheduleNotFoundError extends Data.TaggedError(
  "NotificationScheduleNotFoundError",
)<{
  scheduleId: string;
}>() {}

/**
 * Invalid schedule dates error
 */
export class InvalidScheduleDatesError extends Data.TaggedError(
  "InvalidScheduleDatesError",
)<{
  startDate: Date;
  endDate: Date;
  reason: string;
}>() {}

/**
 * Invalid schedule time error
 */
export class InvalidScheduleTimeError extends Data.TaggedError(
  "InvalidScheduleTimeError",
)<{
  hour: number;
  minute: number;
  reason: string;
}>() {}

/**
 * Invalid notification content error
 */
export class InvalidNotificationContentError extends Data.TaggedError(
  "InvalidNotificationContentError",
)<{
  field: string;
  reason: string;
}>() {}

/**
 * Schedule already exists error
 */
export class ScheduleAlreadyExistsError extends Data.TaggedError(
  "ScheduleAlreadyExistsError",
)<{
  tripId: string;
  name: string;
}>() {}
