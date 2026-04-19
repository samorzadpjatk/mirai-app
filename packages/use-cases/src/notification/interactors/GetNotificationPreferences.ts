import { Effect, Data } from "effect";
import { NotificationPreferencesPortTag } from "../ports/NotificationPort";
import type { NotificationPreferences } from "@mirai-app/domain";

/**
 * Input for GetNotificationPreferencesUseCase
 */
export interface GetNotificationPreferencesInput {
  userId: string;
}

/**
 * DTO for notification preferences
 */
export interface NotificationPreferencesDTO {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  challengeEnabled: boolean;
  rankingEnabled: boolean;
  systemEnabled: boolean;
}

/**
 * Get Notification Preferences Use Case
 *
 * Retrieves the notification preferences for a user.
 * Returns default preferences if none exist.
 */
export class GetNotificationPreferencesUseCase {
  execute(input: GetNotificationPreferencesInput) {
    return Effect.gen(function* () {
      const preferencesPort = yield* NotificationPreferencesPortTag;

      const preferences = yield* preferencesPort.findByUserId(input.userId);

      if (!preferences) {
        // Return default preferences
        return {
          userId: input.userId,
          pushEnabled: true,
          emailEnabled: true,
          challengeEnabled: true,
          rankingEnabled: true,
          systemEnabled: true,
        };
      }

      return {
        userId: preferences.userId,
        pushEnabled: preferences.pushEnabled,
        emailEnabled: preferences.emailEnabled,
        challengeEnabled: preferences.challengeEnabled,
        rankingEnabled: preferences.rankingEnabled,
        systemEnabled: preferences.systemEnabled,
      };
    });
  }
}
