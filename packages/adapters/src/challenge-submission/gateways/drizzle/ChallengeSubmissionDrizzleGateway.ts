import { Effect } from "effect";
import { eq, count, and } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  challengeSubmissions,
  challenges,
  type ChallengeSubmissionSelect,
} from "../../../infrastructure/drizzle";
import {
  DatabaseError,
  EntityNotFoundError,
  ChallengeSubmissionId,
  ChallengeId,
  GroupId,
} from "@mirai-app/domain";
import type {
  ChallengeSubmission,
  IChallengeSubmissionPort,
} from "@mirai-app/use-cases/challenge-submission/ports/ChallengeSubmissionPort";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ChallengeSubmissionMapper } from "../../mappers/ChallengeSubmissionMapper";

/**
 * ChallengeSubmission Drizzle Gateway
 *
 * Implements IChallengeSubmissionPort using Drizzle ORM for database operations.
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Challenge submissions are scoped to trips via the challenge's tripId.
 */
export class ChallengeSubmissionDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengeSubmissionPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: ChallengeSubmissionId) {
    const submissionIdStr = ChallengeSubmissionId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Fetch the submission
      const dbSubmission = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeSubmissions)
            .where(eq(challengeSubmissions.id, submissionIdStr))
            .limit(1)
            .then((r: ChallengeSubmissionSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findById",
            id: submissionIdStr,
            cause: error,
          }),
      });

      if (!dbSubmission) {
        return null;
      }

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, dbSubmission.challengeId))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findById.challengeLookup",
            id: dbSubmission.challengeId,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: dbSubmission.challengeId }),
        );
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "read",
        });
      }

      return ChallengeSubmissionMapper.toDomain(dbSubmission);
    });
  }

  findByChallengeId(challengeId: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findByChallengeId.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "read",
        });
      }

      // Fetch submissions
      const dbSubmissions = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeSubmissions)
            .where(eq(challengeSubmissions.challengeId, challengeIdStr))
            .orderBy(challengeSubmissions.createdAt)
            .then((r: ChallengeSubmissionSelect[]) => r),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findByChallengeId",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return dbSubmissions.map((dbSubmission) =>
        ChallengeSubmissionMapper.toDomain(dbSubmission),
      );
    });
  }

  findByChallengeAndGroup(challengeId: ChallengeId, groupId: GroupId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const groupIdStr = GroupId.toString(groupId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findByChallengeAndGroup.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "read",
        });
      }

      // Fetch submission
      const dbSubmission = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeSubmissions)
            .where(
              and(
                eq(challengeSubmissions.challengeId, challengeIdStr),
                eq(challengeSubmissions.groupId, groupIdStr),
              ),
            )
            .limit(1)
            .then((r: ChallengeSubmissionSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findByChallengeAndGroup",
            id: `${challengeIdStr}:${groupIdStr}`,
            cause: error,
          }),
      });

      return dbSubmission ? ChallengeSubmissionMapper.toDomain(dbSubmission) : null;
    });
  }

  findByGroupId(groupId: GroupId) {
    const groupIdStr = GroupId.toString(groupId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Verify access before fetching (need to check if user has access to any trips with this group)
      // For now, we'll do the auth check after fetching and checking challenge tripIds
      // This is a read operation, so verify read access to the trip context

      // Fetch submissions
      const dbSubmissions = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeSubmissions)
            .where(eq(challengeSubmissions.groupId, groupIdStr))
            .orderBy(challengeSubmissions.createdAt)
            .then((r: ChallengeSubmissionSelect[]) => r),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.findByGroupId",
            id: groupIdStr,
            cause: error,
          }),
      });

      // Get unique challenge IDs
      const challengeIds = [...new Set(dbSubmissions.map((s) => s.challengeId))];

      if (challengeIds.length > 0 && authCtx.isAuthenticated) {
        // Get tripIds for auth check
        const challengeResults = yield* Effect.tryPromise({
          try: () =>
            self.db
              .select({ id: challenges.id, tripId: challenges.tripId })
              .from(challenges)
              .where(and(...challengeIds.map((id) => eq(challenges.id, id))))
              .then((r) => r),
          catch: (error) =>
            new DatabaseError({
              operation: "ChallengeSubmissionDrizzleGateway.findByGroupId.challengeLookup",
              id: challengeIds.join(","),
              cause: error,
            }),
        });

        const authZPort = yield* AuthZPortTag;
        const uniqueTripIds = [...new Set(challengeResults.map((c) => c.tripId))];

        // Verify read access to at least one trip (simplified - checking all)
        for (const tripId of uniqueTripIds) {
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: tripId,
            requiredPermission: "read",
          });
        }
      }

      return dbSubmissions.map((dbSubmission) =>
        ChallengeSubmissionMapper.toDomain(dbSubmission),
      );
    });
  }

  create(submission: ChallengeSubmission) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeIdStr = ChallengeId.toString(submission.challengeId);
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.create.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // Verify write access for creating submissions
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "write",
        });
      }

      // Create the submission
      const dbSubmission = yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .insert(challengeSubmissions)
            .values({
              id: ChallengeSubmissionId.toString(submission.id),
              challengeId: ChallengeId.toString(submission.challengeId),
              groupId: GroupId.toString(submission.groupId),
              imageIds: submission.imageIds,
              videoId: submission.videoId,
              textContent: submission.textContent,
              latitude: submission.latitude,
              longitude: submission.longitude,
              status: submission.status,
              reviewedById: submission.reviewedById,
              reviewedAt: submission.reviewedAt,
              rejectionReason: submission.rejectionReason,
              awardedPoints: submission.awardedPoints ?? undefined,
              bonusPoints: submission.bonusPoints ?? undefined,
              ranking: submission.ranking ?? undefined,
              voteCount: submission.voteCount,
              voteScore: submission.voteScore,
              createdAt: submission.createdAt,
              updatedAt: submission.updatedAt,
            })
            .returning();
          if (!result) throw new Error("Failed to create challenge submission");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.create",
            id: ChallengeSubmissionId.toString(submission.id),
            cause: error,
          }),
      });

      return ChallengeSubmissionMapper.toDomain(dbSubmission);
    });
  }

  update(submission: ChallengeSubmission) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeIdStr = ChallengeId.toString(submission.challengeId);
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.update.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // Verify write access for updating submissions
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "write",
        });
      }

      // Update the submission
      const dbSubmission = yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .update(challengeSubmissions)
            .set({
              challengeId: ChallengeId.toString(submission.challengeId),
              groupId: GroupId.toString(submission.groupId),
              imageIds: submission.imageIds,
              videoId: submission.videoId,
              textContent: submission.textContent,
              latitude: submission.latitude,
              longitude: submission.longitude,
              status: submission.status,
              reviewedById: submission.reviewedById,
              reviewedAt: submission.reviewedAt,
              rejectionReason: submission.rejectionReason,
              awardedPoints: submission.awardedPoints ?? undefined,
              bonusPoints: submission.bonusPoints ?? undefined,
              ranking: submission.ranking ?? undefined,
              voteCount: submission.voteCount,
              voteScore: submission.voteScore,
              updatedAt: new Date(),
            })
            .where(eq(challengeSubmissions.id, ChallengeSubmissionId.toString(submission.id)))
            .returning();
          if (!result) throw new Error("Failed to update challenge submission");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.update",
            id: ChallengeSubmissionId.toString(submission.id),
            cause: error,
          }),
      });

      return ChallengeSubmissionMapper.toDomain(dbSubmission);
    });
  }

  delete(id: ChallengeSubmissionId) {
    const submissionIdStr = ChallengeSubmissionId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Fetch the submission first to get challengeId for auth check
      const dbSubmission = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeSubmissions)
            .where(eq(challengeSubmissions.id, submissionIdStr))
            .limit(1)
            .then((r: ChallengeSubmissionSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.delete.submissionLookup",
            id: submissionIdStr,
            cause: error,
          }),
      });

      if (!dbSubmission) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "ChallengeSubmission", identifier: submissionIdStr }),
        );
      }

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, dbSubmission.challengeId))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.delete.challengeLookup",
            id: dbSubmission.challengeId,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: dbSubmission.challengeId }),
        );
      }

      // Verify write access for deleting submissions
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "write",
        });
      }

      // Delete the submission
      yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(challengeSubmissions)
            .where(eq(challengeSubmissions.id, submissionIdStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.delete",
            id: submissionIdStr,
            cause: error,
          }),
      });
    });
  }

  countByChallengeId(challengeId: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.countByChallengeId.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "read",
        });
      }

      // Count submissions
      const result = yield* Effect.tryPromise({
        try: async () => {
          const r = await self.db
            .select({ count: count() })
            .from(challengeSubmissions)
            .where(eq(challengeSubmissions.challengeId, challengeIdStr));
          return r[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.countByChallengeId",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return result;
    });
  }

  countPendingByChallengeId(challengeId: ChallengeId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, challengeIdStr))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.countPendingByChallengeId.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // If authenticated, verify access using tripRoles from context
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: challengeResult.tripId,
          requiredPermission: "read",
        });
      }

      // Count pending submissions
      const result = yield* Effect.tryPromise({
        try: async () => {
          const r = await self.db
            .select({ count: count() })
            .from(challengeSubmissions)
            .where(
              and(
                eq(challengeSubmissions.challengeId, challengeIdStr),
                eq(challengeSubmissions.status, "PENDING"),
              ),
            );
          return r[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeSubmissionDrizzleGateway.countPendingByChallengeId",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return result;
    });
  }
}
