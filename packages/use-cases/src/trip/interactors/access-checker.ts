import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  users,
  tripParticipants,
  groups,
  trips,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { Effect } from "effect";
import { UseCaseError } from "../../system/errors";

export interface GroupLeaderCheckResult {
  isLeader: boolean;
  groupId?: string;
  groupName?: string;
  coins?: number;
}

/**
 * Checks trip and user access permissions
 */
export class TripAccessChecker {
  constructor(private db: DrizzleDb) {}

  isStaff(userId: string): Effect.Effect<boolean, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [user] = await this.db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        return user?.role === "ADMIN" || user?.role === "MODERATOR";
      },
      catch: (error) =>
        new UseCaseError({
          operation: "isStaff",
          message: `Failed to check staff status for user ${userId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  isGroupLeader(
    userId: string,
    tripId: string,
  ): Effect.Effect<GroupLeaderCheckResult, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [participant] = await this.db
          .select({
            groupId: tripParticipants.groupId,
          })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.userId, userId),
              eq(tripParticipants.tripId, tripId),
            ),
          )
          .limit(1);

        if (!participant?.groupId) {
          return { isLeader: false };
        }

        const [group] = await this.db
          .select({
            id: groups.id,
            name: groups.name,
            coins: groups.coins,
            organizerId: groups.organizerId,
          })
          .from(groups)
          .where(eq(groups.id, participant.groupId))
          .limit(1);

        if (!group) {
          return { isLeader: false };
        }

        return {
          isLeader: group.organizerId === userId,
          groupId: group.id,
          groupName: group.name,
          coins: group.coins,
        };
      },
      catch: (error) =>
        new UseCaseError({
          operation: "isGroupLeader",
          message: `Failed to check group leader status for user ${userId} in trip ${tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  hasTripEnded(tripId: string): Effect.Effect<boolean, UseCaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [trip] = await this.db
          .select({ endDate: trips.endDate })
          .from(trips)
          .where(eq(trips.id, tripId))
          .limit(1);

        if (!trip?.endDate) return false;
        return new Date() > trip.endDate;
      },
      catch: (error) =>
        new UseCaseError({
          operation: "hasTripEnded",
          message: `Failed to check if trip ${tripId} has ended: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
