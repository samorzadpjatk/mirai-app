import { Context, Effect } from "effect";
import type { IPortError } from "@mirai-app/domain";

/**
 * Notification Port - Repository interface with Context.Tag for Effect DI
 */
export interface INotificationPort {
  findById(id: string): Effect.Effect<Notification | null, IPortError, never>;
  findByUserId(
    userId: string,
  ): Effect.Effect<Notification[], IPortError, never>;
  findPaginatedByUserId(
    userId: string,
    params: { page: number; pageSize: number },
  ): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], IPortError, never>;
  findPaginated(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  create(
    notification: Notification,
  ): Effect.Effect<Notification, IPortError, never>;
  update(
    notification: Notification,
  ): Effect.Effect<Notification, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  markAsSent(id: string): Effect.Effect<void, IPortError, never>;
  markAsFailed(
    id: string,
    reason: string,
  ): Effect.Effect<void, IPortError, never>;
  findWithPushes(
    notificationId: string,
  ): Effect.Effect<
    { notification: Notification; pushes: NotificationPush[] } | null,
    IPortError,
    never
  >;
  getFailedPushes(
    notificationId: string,
  ): Effect.Effect<NotificationPush[], IPortError, never>;
  resetFailedPushes(
    notificationId: string,
  ): Effect.Effect<void, IPortError, never>;
}

export class NotificationPortTag extends Context.Tag("NotificationPort")<
  NotificationPortTag,
  INotificationPort
>() {}

/**
 * Notification entity interface for use cases
 */
export interface Notification {
  id: string;
  tripId: string | null;
  title: string;
  body: string;
  url: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification push record
 */
export interface NotificationPush {
  id: string;
  notificationId: string;
  targetUserId: string;
  status: "pending" | "sent" | "failed";
  sentAt: Date | null;
  failureReason: string | null;
}

/**
 * PushSubscription Port
 */
export interface IPushSubscriptionPort {
  findByUserId(
    userId: string,
  ): Effect.Effect<PushSubscription[], IPortError, never>;
  findByToken(
    token: string,
  ): Effect.Effect<PushSubscription | null, IPortError, never>;
  findByUserIdAndToken(
    userId: string,
    token: string,
  ): Effect.Effect<PushSubscription | null, IPortError, never>;
  create(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, IPortError, never>;
  update(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  deleteByTokenAndUserId(
    token: string,
    userId: string,
  ): Effect.Effect<number, IPortError, never>;
  deleteAllByUserId(userId: string): Effect.Effect<number, IPortError, never>;
  findAll(): Effect.Effect<PushSubscription[], IPortError, never>;
}

export class PushSubscriptionPortTag extends Context.Tag(
  "PushSubscriptionPort",
)<PushSubscriptionPortTag, IPushSubscriptionPort>() {}

/**
 * PushSubscription entity interface
 */
export interface PushSubscription {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationSchedule Port
 */
export interface INotificationSchedulePort {
  findAll(params: {
    tripId?: string | null;
    notificationType?: string;
    isActive?: boolean;
    startDateFrom?: Date;
    startDateTo?: Date;
    search?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      schedules: NotificationSchedule[];
      total: number;
      hasMore: boolean;
    },
    IPortError,
    never
  >;
  findActive(): Effect.Effect<NotificationSchedule[], IPortError, never>;
  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], IPortError, never>;
  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, IPortError, never>;
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, IPortError, never>;
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  deleteMany(ids: string[]): Effect.Effect<number, IPortError, never>;
  toggleActive(
    id: string,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  toggleMany(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, IPortError, never>;
  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, IPortError, never>;
  countExecutions(id: string): Effect.Effect<number, IPortError, never>;
}

export class NotificationSchedulePortTag extends Context.Tag(
  "NotificationSchedulePort",
)<NotificationSchedulePortTag, INotificationSchedulePort>() {}

/**
 * NotificationSchedule entity interface
 */
export interface NotificationSchedule {
  id: string;
  name: string;
  tripId: string | null;
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
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * NotificationScheduleExecution Port
 */
export interface INotificationScheduleExecutionPort {
  findByScheduleId(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecution[], IPortError, never>;
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationScheduleExecution | null, IPortError, never>;
  create(
    execution: NotificationScheduleExecution,
  ): Effect.Effect<NotificationScheduleExecution, IPortError, never>;
}

export class NotificationScheduleExecutionPortTag extends Context.Tag(
  "NotificationScheduleExecutionPort",
)<NotificationScheduleExecutionPortTag, INotificationScheduleExecutionPort>() {}

/**
 * NotificationScheduleExecution entity interface
 */
export interface NotificationScheduleExecution {
  id: string;
  scheduleId: string;
  notificationId: string;
  executedAt: Date;
}

/**
 * NotificationDelivery Port
 */
export interface INotificationDeliveryPort {
  findAll(params: {
    tripId?: string;
    status?: string;
    scheduleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      deliveries: NotificationDelivery[];
      total: number;
    },
    IPortError,
    never
  >;
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, IPortError, never>;
  findFailed(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      deliveries: NotificationDelivery[];
      total: number;
    },
    IPortError,
    never
  >;
  getStats(params: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }): Effect.Effect<NotificationDeliveryStats, IPortError, never>;
  create(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, IPortError, never>;
  update(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, IPortError, never>;
}

export class NotificationDeliveryPortTag extends Context.Tag(
  "NotificationDeliveryPort",
)<NotificationDeliveryPortTag, INotificationDeliveryPort>() {}

/**
 * NotificationDelivery entity interface
 */
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  tripId: string | null;
  scheduleId: string | null;
  status: "pending" | "success" | "partial_failure" | "failure";
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  totalRecipients: number | null;
  successCount: number | null;
  failureCount: number | null;
  errors: string | null;
}

/**
 * NotificationDeliveryStats DTO
 */
export interface NotificationDeliveryStats {
  totalDeliveries: number;
  totalRecipients: number;
  totalSuccess: number;
  totalFailures: number;
  avgSuccessPerDelivery: number;
  avgFailuresPerDelivery: number;
  successRate: number;
  statusBreakdown: Record<string, number>;
}

/**
 * NotificationService Port - for sending notifications
 */
export interface INotificationServicePort {
  sendNotification(params: {
    userIds: string[];
    title: string;
    body: string;
    url: string;
    tripId: string;
    createdById: string;
  }): Effect.Effect<
    {
      success: boolean;
      notificationId: string;
      recipientCount: number;
    },
    IPortError,
    never
  >;
  sendMobileNotifications(notificationId: string): Effect.Effect<
    {
      success: boolean;
      sent: number;
      failed: number;
      total: number;
    },
    IPortError,
    never
  >;
  sendRankingUpdate(params: {
    tripId: string;
    createdById: string;
  }): Effect.Effect<
    {
      success: boolean;
      notificationId: string;
      recipientCount: number;
    },
    IPortError,
    never
  >;
  createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): { title: string; body: string; url: string };
  createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): { title: string; body: string; url: string };
  createNewMemberNotification(
    groupName: string,
    memberName: string,
  ): { title: string; body: string; url: string };
}

export class NotificationServicePortTag extends Context.Tag(
  "NotificationServicePort",
)<NotificationServicePortTag, INotificationServicePort>() {}
