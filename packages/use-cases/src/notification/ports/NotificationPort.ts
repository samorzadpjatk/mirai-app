import { Context, Effect } from "effect";
import type {
  INotificationPort,
  IPushSubscriptionPort,
  INotificationSchedulePort,
  INotificationScheduleExecutionPort,
  INotificationDeliveryPort,
  INotificationServicePort,
  INotificationPreferencesPort,
  Notification,
  NotificationPush,
  PushSubscription,
  NotificationDelivery,
  NotificationDeliveryStats,
  NotificationSchedule,
  NotificationScheduleExecution,
} from "@mirai-app/domain";

// Re-export types for consumers
export type { INotificationPort, Notification, NotificationPush };
export type { IPushSubscriptionPort, PushSubscription };
export type { NotificationDelivery, NotificationDeliveryStats };
export type { NotificationSchedule, NotificationScheduleExecution };
export type { INotificationPreferencesPort };

/**
 * Notification Port - Context.Tag for Effect DI
 */
export class NotificationPortTag extends Context.Tag("NotificationPort")<
  NotificationPortTag,
  INotificationPort
>() {}

/**
 * PushSubscription Port - Context.Tag for Effect DI
 */
export class PushSubscriptionPortTag extends Context.Tag(
  "PushSubscriptionPort",
)<PushSubscriptionPortTag, IPushSubscriptionPort>() {}

/**
 * NotificationSchedule Port - Context.Tag for Effect DI
 */
export class NotificationSchedulePortTag extends Context.Tag(
  "NotificationSchedulePort",
)<NotificationSchedulePortTag, INotificationSchedulePort>() {}

/**
 * NotificationScheduleExecution Port - Context.Tag for Effect DI
 */
export class NotificationScheduleExecutionPortTag extends Context.Tag(
  "NotificationScheduleExecutionPort",
)<NotificationScheduleExecutionPortTag, INotificationScheduleExecutionPort>() {}

/**
 * NotificationDelivery Port - Context.Tag for Effect DI
 */
export class NotificationDeliveryPortTag extends Context.Tag(
  "NotificationDeliveryPort",
)<NotificationDeliveryPortTag, INotificationDeliveryPort>() {}

/**
 * NotificationService Port - Context.Tag for Effect DI
 */
export class NotificationServicePortTag extends Context.Tag(
  "NotificationServicePort",
)<NotificationServicePortTag, INotificationServicePort>() {}

/**
 * NotificationPreferences Port - Context.Tag for Effect DI
 */
export class NotificationPreferencesPortTag extends Context.Tag(
  "NotificationPreferencesPort",
)<NotificationPreferencesPortTag, INotificationPreferencesPort>() {}
