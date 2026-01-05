import type { Prisma } from "@integral-2025-app/db";
import { sendMobileNotifications } from "./mobileSender";

const INACTIVITY_THRESHOLD_MINUTES = 30;
const NOTIFICATION_COOLDOWN_MINUTES = 30;

interface InactivityCheckResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

/**
 * Checks for inactive users and sends notifications to remind them to check their friends' locations.
 * 
 * A user is considered inactive if:
 * - They have a location record
 * - Their location hasn't been updated for at least 30 minutes
 * - They are currently sharing their location (isSharingLocation = true)
 * - They haven't received an inactivity notification in the last 30 minutes (deduplication)
 */
export async function checkInactiveUsers(
  db: Prisma.TransactionClient,
): Promise<InactivityCheckResult> {
  const now = new Date();
  const inactivityThreshold = new Date(
    now.getTime() - INACTIVITY_THRESHOLD_MINUTES * 60 * 1000,
  );
  const notificationCooldown = new Date(
    now.getTime() - NOTIFICATION_COOLDOWN_MINUTES * 60 * 1000,
  );

  // Find users who:
  // 1. Have a location record
  // 2. Haven't updated location in 30+ minutes
  // 3. Are currently sharing location (not paused)
  // 4. Either never received inactivity notification OR last notification was 30+ minutes ago
  const inactiveUsers = await db.location.findMany({
    where: {
      timestamp: {
        lt: inactivityThreshold,
      },
      isSharingLocation: true,
      OR: [
        { lastInactivityNotification: null },
        { lastInactivityNotification: { lt: notificationCooldown } },
      ],
    },
    include: {
      user: true,
    },
  });

  const result: InactivityCheckResult = {
    checked: inactiveUsers.length,
    notified: 0,
    skipped: 0,
    errors: 0,
  };

  if (inactiveUsers.length === 0) {
    return result;
  }

  const firstUser = inactiveUsers[0];
  if (!firstUser) {
    return result;
  }

  // Notification template
  const notificationData = {
    title: "Zobacz gdzie są twoi znajomi",
    body: "Twoi znajomi dzielą się swoją lokalizacją. Zobacz gdzie są!",
    url: "/map",
  };

  // Send mobile notifications to each inactive user
  for (const location of inactiveUsers) {
    try {
      // Create notification for this specific user
      const userNotification = await db.notification.create({
        data: {
          ...notificationData,
          createdById: location.user.id,
        },
      });

      // Send mobile notification
      const sendResult = await sendMobileNotifications(db, userNotification.id);

      if (sendResult.sent > 0) {
        // Update last notification timestamp to prevent duplicate notifications
        await db.location.update({
          where: { id: location.id },
          data: { lastInactivityNotification: now },
        });
        result.notified++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      console.error(
        `Failed to send inactivity notification to user ${location.userId}:`,
        error,
      );
      result.errors++;
    }
  }

  return result;
}
