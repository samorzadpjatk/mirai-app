import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { users } from "@mirai-app/frameworks/drizzle/schema/user";
import { tripParticipants } from "@mirai-app/frameworks/drizzle/schema/trip";
import { groups } from "@mirai-app/frameworks/drizzle/schema/group";
import { trips } from "@mirai-app/frameworks/drizzle/schema/trip";
import { eq, and } from "drizzle-orm";

export interface GroupLeaderCheckResult {
  isLeader: boolean;
  groupId?: string;
  groupName?: string;
  coins?: number;
}

/**
 * Checks trip and user access permissions
 */
export class DrizzleTripAccessChecker {
  constructor(private db: DrizzleDb) {}

  async isStaff(userId: string): Promise<boolean> {
    const [user] = await this.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.role === "ADMIN" || user?.role === "MODERATOR";
  }

  async isGroupLeader(
    userId: string,
    tripId: string,
  ): Promise<GroupLeaderCheckResult> {
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
  }

  async hasTripEnded(tripId: string): Promise<boolean> {
    const [trip] = await this.db
      .select({ endDate: trips.endDate })
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (!trip?.endDate) return false;
    return new Date() > trip.endDate;
  }
}
