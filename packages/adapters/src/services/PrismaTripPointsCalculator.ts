import type { PrismaClient } from "@repo/frameworks/prisma";

/**
 * Calculates total available points for a trip based on challenge configurations
 */
export class PrismaTripPointsCalculator {
  constructor(private prisma: PrismaClient) {}

  async calculateTotalAvailablePoints(tripId: string): Promise<number> {
    const challenges = await this.prisma.challenge.findMany({
      where: { tripId },
      select: {
        basePoints: true,
        firstPlacePoints: true,
        secondPlacePoints: true,
        thirdPlacePoints: true,
        scoringCategory: true,
      },
    });

    let totalPoints = 0;

    for (const challenge of challenges) {
      const basePoints = challenge.basePoints ?? 0;

      if (challenge.scoringCategory === "UNLIMITED") {
        totalPoints += basePoints;
      } else {
        totalPoints += basePoints;
        totalPoints += challenge.firstPlacePoints ?? 0;
        totalPoints += challenge.secondPlacePoints ?? 0;
        totalPoints += challenge.thirdPlacePoints ?? 0;
      }
    }

    return totalPoints;
  }
}
