import { Effect, Data } from "effect";
import { NotificationPreferencesPortTag } from "../ports/NotificationPort";
import type { NotificationPreferences } from "@mirai-app/domain";

/**
 * Input for UpdateNotificationPreferencesUseCase
 */
export interface UpdateNotificationPreferencesInput {
  userId: string;
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  challengeEnabled?: boolean;
  rankingEnabled?: boolean;
  systemEnabled?: boolean;
}

/**
 * DTO for updated notification preferences
 */
export interface UpdateNotificationPreferencesDTO {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  challengeEnabled: boolean;
  rankingEnabled: boolean;
  systemEnabled: boolean;
}

/**
 * Update Notification Preferences Use Case
 *
 * Updates the notification preferences for a user.
 * Creates default preferences if none exist.
 */
export class UpdateNotificationPreferencesUseCase {
  execute(input: UpdateNotificationPreferencesInput) {
    return Effect.gen(function* () {
      const preferencesPort = yield* NotificationPreferencesPortTag;

      // Get existing preferences or create defaults
      const existing = yield* preferencesPort.findByUserId(input.userId);

      const now = new Date();

      const preferences: NotificationPreferences = existing
        ? {
            ...existing,
            pushEnabled: input.pushEnabled ?? existing.pushEnabled,
            emailEnabled: input.emailEnabled ?? existing.emailEnabled,
            challengeEnabled:
              input.challengeEnabled ?? existing.challengeEnabled,
            rankingEnabled: input.rankingEnabled ?? existing.rankingEnabled,
            systemEnabled: input.systemEnabled ?? existing.systemEnabled,
            updatedAt: now,
          }
        : {
            userId: input.userId,
            pushEnabled: input.pushEnabled ?? true,
            emailEnabled: input.emailEnabled ?? true,
            challengeEnabled: input.challengeEnabled ?? true,
            rankingEnabled: input.rankingEnabled ?? true,
            systemEnabled: input.systemEnabled ?? true,
            updatedAt: now,
          };

      // Save preferences
      const saved = existing
        ? yield* preferencesPort.update(preferences)
        : yield* preferencesPort.create(preferences);

      return {
        userId: saved.userId,
        pushEnabled: saved.pushEnabled,
        emailEnabled: saved.emailEnabled,
        challengeEnabled: saved.challengeEnabled,
        rankingEnabled: saved.rankingEnabled,
        systemEnabled: saved.systemEnabled,
      };
    });
  }
}
