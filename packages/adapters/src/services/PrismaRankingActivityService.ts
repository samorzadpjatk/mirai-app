import type { Prisma, PrismaClient } from "@repo/frameworks/prisma";

/**
 * Rank snapshot capturing group rankings at a point in time
 */
export type RankSnapshot = Map<
  string,
  {
    rank: number;
    coins: number;
    name: string;
    image: string | null;
  }
>;

/**
 * Service for capturing and processing ranking activities
 * Manages rank change detection and activity feed creation
 */
export class PrismaRankingActivityService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Capture a snapshot of group rankings for a trip
   * Used before coin operations to detect rank changes
   */
  async captureTripRankingSnapshot(
    tx: Prisma.TransactionClient,
    tripId: string,
  ): Promise<RankSnapshot> {
    const groups = await tx.group.findMany({
      where: { tripId, isDeleted: false },
      orderBy: [{ coins: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        coins: true,
        image: true,
      },
    });

    const snapshot: RankSnapshot = new Map();
    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      if (!group) continue;

      snapshot.set(group.id, {
        rank: index + 1,
        coins: group.coins,
        name: group.name,
        image: group.image,
      });
    }

    return snapshot;
  }

  /**
   * Create activity feed entries when group rankings change
   */
  async createRankChangeActivities(params: {
    tx: Prisma.TransactionClient;
    tripId: string;
    previousSnapshot: RankSnapshot;
    createdByAdmin?: string | null;
  }): Promise<void> {
    if (params.previousSnapshot.size === 0) {
      return;
    }

    const groupsAfter = await params.tx.group.findMany({
      where: { tripId: params.tripId, isDeleted: false },
      orderBy: [{ coins: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        coins: true,
        image: true,
      },
    });

    const rankChanges = groupsAfter
      .map((group, index) => {
        const previous = params.previousSnapshot.get(group.id);
        if (!previous) return null;

        const newRank = index + 1;
        if (newRank === previous.rank) return null;

        return {
          group,
          previousRank: previous.rank,
          newRank,
          coinsBefore: previous.coins,
          coinsAfter: group.coins,
          rankDiff: previous.rank - newRank,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (rankChanges.length === 0) {
      return;
    }

    const movedUp = [...rankChanges]
      .filter((item) => item.rankDiff > 0)
      .sort((a, b) => b.rankDiff - a.rankDiff || a.newRank - b.newRank)[0];

    const movedDown = [...rankChanges]
      .filter((item) => item.rankDiff < 0)
      .sort((a, b) => a.rankDiff - b.rankDiff || b.newRank - a.newRank)[0];

    const anchor = movedUp ?? movedDown ?? rankChanges[0];
    if (!anchor) return;

    const podium = groupsAfter.slice(0, 3).map((group, index) => ({
      medal: index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉",
      name: group?.name ?? "TBD",
    }));

    const movementParts: string[] = [];
    if (movedUp) {
      movementParts.push(
        `⬆️ ${movedUp.group.name}: #${movedUp.previousRank} -> #${movedUp.newRank}`,
      );
    }
    if (movedDown && movedDown.group.id !== movedUp?.group.id) {
      movementParts.push(
        `⬇️ ${movedDown.group.name}: #${movedDown.previousRank} -> #${movedDown.newRank}`,
      );
    }

    const podiumPart = podium
      .map((item) => `${item.medal} ${item.name}`)
      .join(" • ");

    const description = [...movementParts, `Podium: ${podiumPart}`].join(" | ");

    await params.tx.activityFeed.create({
      data: {
        tripId: params.tripId,
        activityType: "rank_change",
        title: "Zmiany w tabeli",
        description,
        imageUrl: anchor.group.image,
        createdByAdmin: params.createdByAdmin ?? null,
        rankChangeActivity: {
          create: {
            groupId: anchor.group.id,
            newRank: anchor.newRank,
            totalCoins: anchor.group.coins,
            coinsGained: anchor.coinsAfter - anchor.coinsBefore,
          },
        },
      },
    });
  }
}
