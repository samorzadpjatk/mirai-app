import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { groups, activityFeed } from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { Effect } from "effect";
import { ServiceError } from "@mirai-app/adapters/errors";

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
export class DrizzleRankingActivityService {
  constructor(private db: DrizzleDb) {}

  /**
   * Capture a snapshot of group rankings for a trip
   * Used before coin operations to detect rank changes
   */
  captureTripRankingSnapshot(
    tx: DrizzleDb,
    tripId: string,
  ): Effect.Effect<RankSnapshot, ServiceError, never> {
    return Effect.tryPromise({
      try: async () => {
        const groupsData = await tx
          .select({
            id: groups.id,
            name: groups.name,
            coins: groups.coins,
            image: groups.image,
          })
          .from(groups)
          .where(and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)))
          .orderBy(desc(groups.coins), asc(groups.id));

        const snapshot: RankSnapshot = new Map();
        for (let index = 0; index < groupsData.length; index += 1) {
          const group = groupsData[index];
          if (!group) continue;

          snapshot.set(group.id, {
            rank: index + 1,
            coins: group.coins,
            name: group.name,
            image: group.image,
          });
        }

        return snapshot;
      },
      catch: (error) =>
        new ServiceError({
          operation: "captureTripRankingSnapshot",
          message: `Failed to capture ranking snapshot for trip ${tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  /**
   * Create activity feed entries when group rankings change
   */
  createRankChangeActivities(params: {
    tx: DrizzleDb;
    tripId: string;
    previousSnapshot: RankSnapshot;
    createdByAdmin?: string | null;
  }): Effect.Effect<void, ServiceError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (params.previousSnapshot.size === 0) {
          return;
        }

        const groupsAfter = await params.tx
          .select({
            id: groups.id,
            name: groups.name,
            coins: groups.coins,
            image: groups.image,
          })
          .from(groups)
          .where(
            and(eq(groups.tripId, params.tripId), eq(groups.isDeleted, false)),
          )
          .orderBy(desc(groups.coins), asc(groups.id));

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

        // Create activity feed entry
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

        const description = [...movementParts, `Podium: ${podiumPart}`].join(
          " | ",
        );

        await params.tx.insert(activityFeed).values({
          tripId: params.tripId,
          activityType: "rank_change",
          title: "Zmiany w tabeli",
          description,
          imageUrl: anchor.group.image,
          createdByAdmin: params.createdByAdmin ?? null,
        });
      },
      catch: (error) =>
        new ServiceError({
          operation: "createRankChangeActivities",
          message: `Failed to create rank change activities for trip ${params.tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
