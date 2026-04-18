import { Effect } from "effect";
import { eq, and, sql } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  activityReactions,
  type ActivityReactionSelect,
} from "../../../infrastructure/drizzle";
import { DatabaseError } from "@mirai-app/domain";
import {
  type IActivityReactionPort,
  type ActivityReaction,
  type ActivityReactionType,
} from "@mirai-app/use-cases/activity-feed/ports";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * ActivityReaction Drizzle Gateway
 *
 * Implements IActivityReactionPort using Drizzle ORM for database operations.
 */
export class ActivityReactionDrizzleGateway
  extends BaseDrizzleGateway
  implements IActivityReactionPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: string) {
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(activityReactions)
          .where(eq(activityReactions.id, id))
          .limit(1);
        return result[0] ?? null;
      },
      id,
    ).pipe(
      Effect.map((dbReaction: ActivityReactionSelect | null) =>
        dbReaction ? this.toDomain(dbReaction) : null,
      ),
    );
  }

  findByActivityId(activityId: string) {
    return this.tryPromise(
      "findByActivityId",
      async () => {
        const results = await this.db
          .select()
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId))
          .orderBy(activityReactions.createdAt);
        return results;
      },
      activityId,
    ).pipe(
      Effect.map((dbReactions: ActivityReactionSelect[]) =>
        dbReactions.map((r) => this.toDomain(r)),
      ),
    );
  }

  findByActivityIdAndUserId(activityId: string, userId: string) {
    return this.tryPromise(
      "findByActivityIdAndUserId",
      async () => {
        const result = await this.db
          .select()
          .from(activityReactions)
          .where(
            and(
              eq(activityReactions.activityId, activityId),
              eq(activityReactions.userId, userId),
            ),
          )
          .limit(1);
        return result[0] ?? null;
      },
      `${activityId}:${userId}`,
    ).pipe(
      Effect.map((dbReaction: ActivityReactionSelect | null) =>
        dbReaction ? this.toDomain(dbReaction) : null,
      ),
    );
  }

  create(reaction: ActivityReaction) {
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(activityReactions)
          .values({
            id: reaction.id,
            activityId: reaction.activityId,
            userId: reaction.userId,
            reactionType: reaction.reactionType,
            createdAt: reaction.createdAt,
          })
          .returning();
        if (!result) throw new Error("Failed to create reaction");
        return result;
      },
      reaction.id,
    ).pipe(
      Effect.map((dbReaction: ActivityReactionSelect) =>
        this.toDomain(dbReaction),
      ),
    );
  }

  delete(id: string) {
    return this.tryPromise(
      "delete",
      async () => {
        await this.db
          .delete(activityReactions)
          .where(eq(activityReactions.id, id));
      },
      id,
    );
  }

  deleteByActivityAndUser(activityId: string, userId: string) {
    return this.tryPromise(
      "deleteByActivityAndUser",
      async () => {
        await this.db
          .delete(activityReactions)
          .where(
            and(
              eq(activityReactions.activityId, activityId),
              eq(activityReactions.userId, userId),
            ),
          );
      },
      `${activityId}:${userId}`,
    );
  }

  countByActivityId(activityId: string) {
    return this.tryPromise(
      "countByActivityId",
      async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId));
        return result[0]?.count ?? 0;
      },
      activityId,
    );
  }

  countByActivityIdAndType(
    activityId: string,
    reactionType: ActivityReactionType,
  ) {
    return this.tryPromise(
      "countByActivityIdAndType",
      async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(activityReactions)
          .where(
            and(
              eq(activityReactions.activityId, activityId),
              eq(activityReactions.reactionType, reactionType),
            ),
          );
        return result[0]?.count ?? 0;
      },
      `${activityId}:${reactionType}`,
    );
  }

  private toDomain(dbReaction: ActivityReactionSelect): ActivityReaction {
    return {
      id: dbReaction.id,
      activityId: dbReaction.activityId,
      userId: dbReaction.userId,
      reactionType: dbReaction.reactionType as ActivityReactionType,
      createdAt: dbReaction.createdAt,
    };
  }
}
