import { Effect } from "effect";

/**
 * Inactivity check result
 */
export interface InactivityCheckResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

/**
 * Check Inactive Users Use Case
 *
 * Checks for inactive users and sends nudge notifications.
 * Note: Inactivity nudge notifications are currently disabled.
 */
export class CheckInactiveUsersUseCase {
  execute(): Effect.Effect<InactivityCheckResult, never, never> {
    return Effect.gen(function* () {
      // Inactivity nudge notifications are disabled
      return {
        checked: 0,
        notified: 0,
        skipped: 0,
        errors: 0,
      };
    });
  }
}
