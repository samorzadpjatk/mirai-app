import type {
  NotificationId,
  NotificationScheduleId,
  TripId,
  UserId,
  GroupId,
} from "@mirai-app/domain";

export type NotificationType =
  | "CHALLENGE_START"
  | "CHALLENGE_END"
  | "VOTING_START"
  | "VOTING_END"
  | "SUBMISSION_APPROVED"
  | "REWARD_PURCHASED"
  | "ANNOUNCEMENT"
  | "RANK_CHANGE"
  | "CUSTOM";

export type NotificationDeliveryStatus =
  | "pending"
  | "success"
  | "partial_failure"
  | "failure";

export type PushStatus = "pending" | "sent" | "failed";

/**
 * DTO for notification
 */
export interface NotificationDTO {
  id: NotificationId;
  tripId: TripId | null;
  title: string;
  body: string;
  url: string | null;
  createdById: UserId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for notification with creator info
 */
export interface NotificationWithCreatorDTO extends NotificationDTO {
  createdBy: {
    id: UserId;
    firstName: string;
    lastName: string;
  } | null;
  pushes: {
    targetUserId: UserId;
    sentAt: Date | null;
    status: PushStatus;
    failureReason: string | null;
  }[];
}

/**
 * DTO for notification creation result
 */
export interface CreateNotificationResultDTO {
  id: NotificationId;
  success: boolean;
  recipientCount: number;
}

/**
 * DTO for subscription status
 */
export interface SubscriptionStatusDTO {
  isSubscribed: boolean;
  subscriptions: {
    id: string;
    token: string;
    createdAt: Date;
  }[];
}

/**
 * DTO for subscribe result
 */
export interface SubscribeResultDTO {
  success: boolean;
  id: string;
}

/**
 * DTO for unsubscribe result
 */
export interface UnsubscribeResultDTO {
  success: boolean;
  deletedCount: number;
}

/**
 * DTO for delete notification result
 */
export interface DeleteNotificationResultDTO {
  success: boolean;
}

/**
 * DTO for retry notification result
 */
export interface RetryNotificationResultDTO {
  success: boolean;
  notificationId: NotificationId;
  retriedCount: number;
  sent: number;
  failed: number;
}

/**
 * DTO for notification schedule
 */
export interface NotificationScheduleDTO {
  id: NotificationScheduleId;
  name: string;
  tripId: TripId | null;
  notificationType: string;
  notificationTitle: string | null;
  notificationBody: string | null;
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

/**
 * DTO for notification schedule with creator and trip info
 */
export interface NotificationScheduleWithRelationsDTO extends NotificationScheduleDTO {
  createdBy: {
    id: UserId;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
  trip: {
    id: TripId;
    name: string;
  } | null;
  executionCount: number;
}

/**
 * DTO for schedule execution history
 */
export interface ScheduleExecutionDTO {
  id: string;
  scheduleId: NotificationScheduleId;
  notificationId: NotificationId;
  executedAt: Date;
  notification: {
    id: NotificationId;
    title: string;
    body: string;
    createdAt: Date;
  };
}

/**
 * DTO for schedule execution history result
 */
export interface ScheduleExecutionHistoryDTO {
  executions: ScheduleExecutionDTO[];
}

/**
 * DTO for create schedule input
 */
export interface CreateScheduleInputDTO {
  name: string;
  tripId: string | null;
  notificationType: string;
  notificationTitle: string | null;
  notificationBody: string | null;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
}

/**
 * DTO for update schedule input
 */
export interface UpdateScheduleInputDTO {
  id: NotificationScheduleId;
  name?: string;
  tripId?: string | null;
  notificationType?: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

/**
 * DTO for upsert template result
 */
export interface UpsertTemplateResultDTO {
  action: "created" | "updated";
  schedule: NotificationScheduleWithRelationsDTO;
}

/**
 * DTO for delete schedule result
 */
export interface DeleteScheduleResultDTO {
  success: boolean;
  message: string;
}

/**
 * DTO for bulk delete schedules result
 */
export interface BulkDeleteSchedulesResultDTO {
  success: boolean;
  deletedCount: number;
  requestedCount: number;
  notFoundIds: string[] | undefined;
}

/**
 * DTO for duplicate schedule result
 */
export interface DuplicateScheduleResultDTO {
  schedule: NotificationScheduleWithRelationsDTO;
}

/**
 * DTO for toggle schedule result
 */
export interface ToggleScheduleResultDTO {
  schedule: NotificationScheduleWithRelationsDTO;
}

/**
 * DTO for bulk toggle schedules result
 */
export interface BulkToggleSchedulesResultDTO {
  success: boolean;
  updatedCount: number;
}

/**
 * DTO for notification delivery
 */
export interface NotificationDeliveryDTO {
  id: string;
  notificationId: NotificationId;
  tripId: TripId | null;
  scheduleId: NotificationScheduleId | null;
  status: NotificationDeliveryStatus;
  deliveryStartedAt: Date;
  deliveryCompletedAt: Date | null;
  totalRecipients: number | null;
  successCount: number | null;
  failureCount: number | null;
  errors: string | null;
  notification: {
    id: NotificationId;
    title: string;
    body: string;
    createdAt: Date;
    createdBy: {
      id: UserId;
      firstName: string;
      lastName: string;
      email: string | null;
    } | null;
  } | null;
}

/**
 * DTO for delivery stats
 */
export interface DeliveryStatsDTO {
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
 * DTO for send notification to group input
 */
export interface SendToGroupInputDTO {
  tripId: TripId;
  groupId: GroupId;
  title: string;
  body: string;
  url: string;
  createdById: UserId;
}

/**
 * DTO for send notification to all input
 */
export interface SendToAllInputDTO {
  tripId: TripId;
  title: string;
  body: string;
  url: string;
  createdById: UserId;
}

/**
 * DTO for send ranking update input
 */
export interface SendRankingUpdateInputDTO {
  tripId: TripId;
  createdById: UserId;
}

/**
 * DTO for send coins notification input
 */
export interface SendCoinsNotificationInputDTO {
  tripId: TripId;
  groupId: GroupId;
  coins: number;
  reason?: string;
  createdById: UserId;
}

/**
 * DTO for send new member notification input
 */
export interface SendNewMemberNotificationInputDTO {
  tripId: TripId;
  groupId: GroupId;
  userId: UserId;
  createdById: UserId;
}

/**
 * DTO for send custom notification input
 */
export interface SendCustomNotificationInputDTO {
  tripId: TripId;
  groupId: GroupId;
  title: string;
  body: string;
  url: string;
  createdById: UserId;
}

/**
 * DTO for mobile notification result
 */
export interface MobileNotificationResultDTO {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

/**
 * DTO for track delivery start input
 */
export interface TrackDeliveryStartInputDTO {
  notificationId: NotificationId;
}

/**
 * DTO for track delivery complete input
 */
export interface TrackDeliveryCompleteInputDTO {
  notificationId: NotificationId;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  errors: string | null;
}

/**
 * DTO for track delivery failure input
 */
export interface TrackDeliveryFailureInputDTO {
  notificationId: NotificationId;
  error: string;
}

/**
 * DTO for notification filter
 */
export interface NotificationScheduleFilterDTO {
  tripId?: string | null;
  notificationType?: string;
  isActive?: boolean;
  startDateFrom?: Date;
  startDateTo?: Date;
  search?: string;
}

/**
 * DTO for pagination params
 */
export interface PaginationParamsDTO {
  limit: number;
  offset: number;
}
