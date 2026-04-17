import { Context, Effect } from "effect";
import type { DatabaseError } from "@mirai-app/domain";

/**
 * Notification Port - Repository interface with Context.Tag for Effect DI
 */
export interface INotificationPort {
  findById(
    id: string,
  ): Effect.Effect<Notification | null, DatabaseError, never>;
  findByUserId(
    userId: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;
  findPaginatedByUserId(
    userId: string,
    params: { page: number; pageSize: number },
  ): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;
  findPaginated(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  create(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never>;
  update(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  markAsSent(id: string): Effect.Effect<void, DatabaseError, never>;
  markAsFailed(
    id: string,
    reason: string,
  ): Effect.Effect<void, DatabaseError, never>;
  findWithPushes(
    notificationId: string,
  ): Effect.Effect<
    { notification: Notification; pushes: NotificationPush[] } | null,
    DatabaseError,
    never
  >;
  getFailedPushes(
    notificationId: string,
  ): Effect.Effect<NotificationPush[], DatabaseError, never>;
  resetFailedPushes(
    notificationId: string,
  ): Effect.Effect<void, DatabaseError, never>;
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
  ): Effect.Effect<PushSubscription[], DatabaseError, never>;
  findByToken(
    token: string,
  ): Effect.Effect<PushSubscription | null, DatabaseError, never>;
  findByUserIdAndToken(
    userId: string,
    token: string,
  ): Effect.Effect<PushSubscription | null, DatabaseError, never>;
  create(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never>;
  update(
    subscription: PushSubscription,
  ): Effect.Effect<PushSubscription, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  deleteByTokenAndUserId(
    token: string,
    userId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  deleteAllByUserId(
    userId: string,
  ): Effect.Effect<number, DatabaseError, never>;
  findAll(): Effect.Effect<PushSubscription[], DatabaseError, never>;
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
    DatabaseError,
    never
  >;
  findActive(): Effect.Effect<NotificationSchedule[], DatabaseError, never>;
  findUpcoming(
    days: number,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;
  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never>;
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never>;
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  deleteMany(ids: string[]): Effect.Effect<number, DatabaseError, never>;
  toggleActive(
    id: string,
    isActive: boolean,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;
  toggleMany(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, DatabaseError, never>;
  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;
  countExecutions(id: string): Effect.Effect<number, DatabaseError, never>;
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
  ): Effect.Effect<NotificationScheduleExecution[], DatabaseError, never>;
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationScheduleExecution | null, DatabaseError, never>;
  create(
    execution: NotificationScheduleExecution,
  ): Effect.Effect<NotificationScheduleExecution, DatabaseError, never>;
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
    DatabaseError,
    never
  >;
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, DatabaseError, never>;
  findFailed(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    {
      deliveries: NotificationDelivery[];
      total: number;
    },
    DatabaseError,
    never
  >;
  getStats(params: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }): Effect.Effect<NotificationDeliveryStats, DatabaseError, never>;
  create(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, DatabaseError, never>;
  update(
    delivery: NotificationDelivery,
  ): Effect.Effect<NotificationDelivery, DatabaseError, never>;
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
    DatabaseError,
    never
  >;
  sendMobileNotifications(notificationId: string): Effect.Effect<
    {
      success: boolean;
      sent: number;
      failed: number;
      total: number;
    },
    DatabaseError,
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
    DatabaseError,
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
