import { Context, Effect } from "effect";
import type {
  INotificationPort,
  IPushSubscriptionPort,
  INotificationSchedulePort,
  INotificationScheduleExecutionPort,
  INotificationDeliveryPort,
  INotificationServicePort,
} from "@mirai-app/domain";

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
