import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * NotificationPreferences entity
 * Stores user preferences for different notification channels
 */
export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  challengeEnabled: boolean;
  rankingEnabled: boolean;
  systemEnabled: boolean;
  updatedAt: Date;
}

/**
 * NotificationPreferences Port
 * Defines repository operations for notification preferences
 */
export interface INotificationPreferencesPort {
  findByUserId(
    userId: string,
  ): Effect.Effect<NotificationPreferences | null, IPortError, never>;
  create(
    preferences: NotificationPreferences,
  ): Effect.Effect<NotificationPreferences, IPortError, never>;
  update(
    preferences: NotificationPreferences,
  ): Effect.Effect<NotificationPreferences, IPortError, never>;
}
