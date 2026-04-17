import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { NotificationId } from "../value-objects/NotificationId";

/**
 * Notification result from sending a notification
 */
export interface SendNotificationResult {
  success: boolean;
  notificationId: NotificationId;
  recipientCount: number;
}

/**
 * Mobile notification send result
 */
export interface MobileNotificationResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

/**
 * Notification content DTO
 */
export interface NotificationContent {
  title: string;
  body: string;
  url: string;
}

/**
 * NotificationService Port
 * Defines service operations for sending notifications
 */
export interface INotificationServicePort {
  sendNotification(params: {
    userIds: string[];
    title: string;
    body: string;
    url: string;
    tripId: string;
    createdById: string;
  }): Effect.Effect<SendNotificationResult, IPortError, never>;
  sendMobileNotifications(
    notificationId: NotificationId,
  ): Effect.Effect<MobileNotificationResult, IPortError, never>;
  sendRankingUpdate(params: {
    tripId: string;
    createdById: string;
  }): Effect.Effect<SendNotificationResult, IPortError, never>;
  createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): NotificationContent;
  createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason?: string,
  ): NotificationContent;
  createNewMemberNotification(
    groupName: string,
    memberName: string,
  ): NotificationContent;
}
