import type { PrismaClient } from "@mirai-app/frameworks/prisma";

export interface GroupLeaderCheckResult {
  isLeader: boolean;
  groupId?: string;
  groupName?: string;
  coins?: number;
}

/**
 * Checks trip and user access permissions
 */
export class PrismaTripAccessChecker {
  constructor(private prisma: PrismaClient) {}

  async isStaff(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === "ADMIN" || user?.role === "MODERATOR";
  }

  async isGroupLeader(
    userId: string,
    tripId: string,
  ): Promise<GroupLeaderCheckResult> {
    const participant = await this.prisma.tripParticipant.findFirst({
      where: { userId, tripId },
      include: {
        group: {
          select: { id: true, name: true, coins: true, organizerId: true },
        },
      },
    });

    if (!participant?.group) {
      return { isLeader: false };
    }

    return {
      isLeader: participant.group.organizerId === userId,
      groupId: participant.group.id,
      groupName: participant.group.name,
      coins: participant.group.coins,
    };
  }

  async hasTripEnded(tripId: string): Promise<boolean> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { endDate: true },
    });

    if (!trip?.endDate) return false;
    return new Date() > trip.endDate;
  }
}
