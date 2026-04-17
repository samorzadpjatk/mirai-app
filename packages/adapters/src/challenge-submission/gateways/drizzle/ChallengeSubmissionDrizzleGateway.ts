import { Effect } from "effect";
import { eq, count, and } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challengeSubmissions,
  type ChallengeSubmissionSelect,
} from "@mirai-app/frameworks/drizzle";
import { DatabaseError } from "@mirai-app/domain";
import type {
  ChallengeSubmission,
  IChallengeSubmissionPort,
} from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeSubmissionMapper } from "../../mappers/ChallengeSubmissionMapper";

/**
 * ChallengeSubmission Drizzle Gateway
 *
 * Implements IChallengeSubmissionPort using Drizzle ORM for database operations.
 */
export class ChallengeSubmissionDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengeSubmissionPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(
    id: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return this.tryPromise(
      "findById",
      async () => {
        const result = await this.db
          .select()
          .from(challengeSubmissions)
          .where(eq(challengeSubmissions.id, id))
          .limit(1);
        return result[0] ?? null;
      },
      id,
    ).pipe(
      Effect.map((dbSubmission: ChallengeSubmissionSelect | null) =>
        dbSubmission ? ChallengeSubmissionMapper.toDomain(dbSubmission) : null,
      ),
    );
  }

  findByChallengeId(
    challengeId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return this.tryPromise(
      "findByChallengeId",
      async () => {
        const results = await this.db
          .select()
          .from(challengeSubmissions)
          .where(eq(challengeSubmissions.challengeId, challengeId))
          .orderBy(challengeSubmissions.createdAt);
        return results;
      },
      challengeId,
    ).pipe(
      Effect.map((dbSubmissions: ChallengeSubmissionSelect[]) =>
        dbSubmissions.map((dbSubmission) =>
          ChallengeSubmissionMapper.toDomain(dbSubmission),
        ),
      ),
    );
  }

  findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Effect.Effect<ChallengeSubmission | null, DatabaseError, never> {
    return this.tryPromise(
      "findByChallengeAndGroup",
      async () => {
        const result = await this.db
          .select()
          .from(challengeSubmissions)
          .where(
            and(
              eq(challengeSubmissions.challengeId, challengeId),
              eq(challengeSubmissions.groupId, groupId),
            ),
          )
          .limit(1);
        return result[0] ?? null;
      },
      `${challengeId}:${groupId}`,
    ).pipe(
      Effect.map((dbSubmission: ChallengeSubmissionSelect | null) =>
        dbSubmission ? ChallengeSubmissionMapper.toDomain(dbSubmission) : null,
      ),
    );
  }

  findByGroupId(
    groupId: string,
  ): Effect.Effect<ChallengeSubmission[], DatabaseError, never> {
    return this.tryPromise(
      "findByGroupId",
      async () => {
        const results = await this.db
          .select()
          .from(challengeSubmissions)
          .where(eq(challengeSubmissions.groupId, groupId))
          .orderBy(challengeSubmissions.createdAt);
        return results;
      },
      groupId,
    ).pipe(
      Effect.map((dbSubmissions: ChallengeSubmissionSelect[]) =>
        dbSubmissions.map((dbSubmission) =>
          ChallengeSubmissionMapper.toDomain(dbSubmission),
        ),
      ),
    );
  }

  create(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(challengeSubmissions)
          .values({
            id: submission.id,
            challengeId: submission.challengeId,
            groupId: submission.groupId,
            imageIds: submission.imageIds,
            videoId: submission.videoId,
            textContent: submission.textContent,
            latitude: submission.latitude,
            longitude: submission.longitude,
            status: submission.status,
            reviewedById: submission.reviewedById,
            reviewedAt: submission.reviewedAt,
            rejectionReason: submission.rejectionReason,
            awardedPoints: submission.awardedPoints,
            bonusPoints: submission.bonusPoints,
            ranking: submission.ranking,
            voteCount: submission.voteCount,
            voteScore: submission.voteScore,
            createdAt: submission.createdAt,
            updatedAt: submission.updatedAt,
          })
          .returning();
        if (!result) throw new Error("Failed to create challenge submission");
        return result;
      },
      submission.id,
    ).pipe(
      Effect.map((dbSubmission: ChallengeSubmissionSelect) =>
        ChallengeSubmissionMapper.toDomain(dbSubmission),
      ),
    );
  }

  update(
    submission: ChallengeSubmission,
  ): Effect.Effect<ChallengeSubmission, DatabaseError, never> {
    return this.tryPromise(
      "update",
      async () => {
        const [result] = await this.db
          .update(challengeSubmissions)
          .set({
            challengeId: submission.challengeId,
            groupId: submission.groupId,
            imageIds: submission.imageIds,
            videoId: submission.videoId,
            textContent: submission.textContent,
            latitude: submission.latitude,
            longitude: submission.longitude,
            status: submission.status,
            reviewedById: submission.reviewedById,
            reviewedAt: submission.reviewedAt,
            rejectionReason: submission.rejectionReason,
            awardedPoints: submission.awardedPoints,
            bonusPoints: submission.bonusPoints,
            ranking: submission.ranking,
            voteCount: submission.voteCount,
            voteScore: submission.voteScore,
            updatedAt: new Date(),
          })
          .where(eq(challengeSubmissions.id, submission.id))
          .returning();
        if (!result) throw new Error("Failed to update challenge submission");
        return result;
      },
      submission.id,
    ).pipe(
      Effect.map((dbSubmission: ChallengeSubmissionSelect) =>
        ChallengeSubmissionMapper.toDomain(dbSubmission),
      ),
    );
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.tryPromise(
      "delete",
      async () => {
        await this.db
          .delete(challengeSubmissions)
          .where(eq(challengeSubmissions.id, id));
      },
      id,
    );
  }

  countByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "countByChallengeId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challengeSubmissions)
          .where(eq(challengeSubmissions.challengeId, challengeId));
        return result[0]?.count ?? 0;
      },
      challengeId,
    );
  }

  countPendingByChallengeId(
    challengeId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return this.tryPromise(
      "countPendingByChallengeId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challengeSubmissions)
          .where(
            and(
              eq(challengeSubmissions.challengeId, challengeId),
              eq(challengeSubmissions.status, "PENDING"),
            ),
          );
        return result[0]?.count ?? 0;
      },
      challengeId,
    );
  }
}
