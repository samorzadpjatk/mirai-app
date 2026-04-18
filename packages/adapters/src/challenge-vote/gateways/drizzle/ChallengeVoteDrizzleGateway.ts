import { Effect } from "effect";
import { eq, count, and, inArray } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  challengeVotes,
  challenges,
  type ChallengeVoteSelect,
  type ChallengeVoteInsert,
} from "../../../infrastructure/drizzle";
import {
  DatabaseError,
  EntityNotFoundError,
  ChallengeVoteId,
  ChallengeId,
  ChallengeSubmissionId,
  UserId,
} from "@mirai-app/domain";
import type {
  IChallengeVotePort,
  ChallengeVote,
} from "@mirai-app/use-cases/challenge-vote/ports/ChallengeVotePort";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * ChallengeVote Drizzle Gateway
 *
 * Implements IChallengeVotePort using Drizzle ORM for database operations.
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Challenge votes are scoped to trips via the challenge's tripId.
 */
export class ChallengeVoteDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengeVotePort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: ChallengeVoteId) {
    const voteIdStr = ChallengeVoteId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Fetch the vote
      const dbVote = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeVotes)
            .where(eq(challengeVotes.id, voteIdStr))
            .limit(1)
            .then((r: ChallengeVoteSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.findById",
            id: voteIdStr,
            cause: error,
          }),
      });

      if (!dbVote) {
        return null;
      }

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, dbVote.challengeId))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.findById.challengeLookup",
            id: dbVote.challengeId,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: dbVote.challengeId }),
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

      return self.toDomain(dbVote);
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
            operation: "ChallengeVoteDrizzleGateway.findByChallengeId.challengeLookup",
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

      // Fetch votes
      const dbVotes = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeVotes)
            .where(eq(challengeVotes.challengeId, challengeIdStr))
            .orderBy(challengeVotes.createdAt)
            .then((r: ChallengeVoteSelect[]) => r),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.findByChallengeId",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return dbVotes.map((dbVote) => self.toDomain(dbVote));
    });
  }

  findByChallengeAndVoter(challengeId: ChallengeId, voterId: UserId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const voterIdStr = UserId.toString(voterId);
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
            operation: "ChallengeVoteDrizzleGateway.findByChallengeAndVoter.challengeLookup",
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

      // Fetch votes
      const dbVotes = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeVotes)
            .where(
              and(
                eq(challengeVotes.challengeId, challengeIdStr),
                eq(challengeVotes.voterId, voterIdStr),
              ),
            )
            .orderBy(challengeVotes.createdAt)
            .then((r: ChallengeVoteSelect[]) => r),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.findByChallengeAndVoter",
            id: `${challengeIdStr}:${voterIdStr}`,
            cause: error,
          }),
      });

      return dbVotes.map((dbVote) => self.toDomain(dbVote));
    });
  }

  create(vote: ChallengeVote) {
    const insertData = this.toInsert(vote);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get the challenge to find tripId for auth check
      const challengeIdStr = ChallengeId.toString(vote.challengeId);
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
            operation: "ChallengeVoteDrizzleGateway.create.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // Verify write access for creating votes
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

      // Create the vote
      const dbVote = yield* Effect.tryPromise({
        try: async () => {
          const [result] = await self.db
            .insert(challengeVotes)
            .values(insertData)
            .returning();
          if (!result) throw new Error("Failed to create challenge vote");
          return result;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.create",
            id: ChallengeVoteId.toString(vote.id),
            cause: error,
          }),
      });

      return self.toDomain(dbVote);
    });
  }

  createMany(votes: ChallengeVote[]) {
    if (votes.length === 0) {
      return Effect.succeed([]);
    }

    const insertData = votes.map((vote) => this.toInsert(vote));
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Get unique challenge IDs to verify access
      const challengeIds = [...new Set(votes.map((v) => ChallengeId.toString(v.challengeId)))];
      
      // Get trip IDs for all challenges
      const challengeResults = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ id: challenges.id, tripId: challenges.tripId })
            .from(challenges)
            .where(inArray(challenges.id, challengeIds))
            .then((r) => r),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.createMany.challengeLookup",
            id: challengeIds.join(","),
            cause: error,
          }),
      });

      if (challengeResults.length !== challengeIds.length) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: "one or more" }),
        );
      }

      // Verify write access for each unique trip
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        const uniqueTripIds = [...new Set(challengeResults.map((c) => c.tripId))];
        
        for (const tripId of uniqueTripIds) {
          yield* authZPort.verifyAccess({
            userId: authCtx.userId,
            role: authCtx.role,
            tripRoles: authCtx.tripRoles,
            resourceType: "trip",
            resourceId: tripId,
            requiredPermission: "write",
          });
        }
      }

      // Create the votes
      const dbVotes = yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db
            .insert(challengeVotes)
            .values(insertData)
            .returning();
          return results;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.createMany",
            id: `${votes.length} votes`,
            cause: error,
          }),
      });

      return dbVotes.map((dbVote) => self.toDomain(dbVote));
    });
  }

  delete(id: ChallengeVoteId) {
    const voteIdStr = ChallengeVoteId.toString(id);
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext to check if authenticated
      const authCtx = yield* AuthContextTag;

      // Fetch the vote first to get challengeId
      const dbVote = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select()
            .from(challengeVotes)
            .where(eq(challengeVotes.id, voteIdStr))
            .limit(1)
            .then((r: ChallengeVoteSelect[]) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.delete.voteLookup",
            id: voteIdStr,
            cause: error,
          }),
      });

      if (!dbVote) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "ChallengeVote", identifier: voteIdStr }),
        );
      }

      // Get the challenge to find tripId for auth check
      const challengeResult = yield* Effect.tryPromise({
        try: () =>
          self.db
            .select({ tripId: challenges.tripId })
            .from(challenges)
            .where(eq(challenges.id, dbVote.challengeId))
            .limit(1)
            .then((r) => r[0] ?? null),
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.delete.challengeLookup",
            id: dbVote.challengeId,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: dbVote.challengeId }),
        );
      }

      // Verify write access for deleting votes
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

      // Delete the vote
      yield* Effect.tryPromise({
        try: async () => {
          await self.db.delete(challengeVotes).where(eq(challengeVotes.id, voteIdStr));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.delete",
            id: voteIdStr,
            cause: error,
          }),
      });
    });
  }

  deleteByChallengeAndVoter(challengeId: ChallengeId, voterId: UserId) {
    const challengeIdStr = ChallengeId.toString(challengeId);
    const voterIdStr = UserId.toString(voterId);
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
            operation: "ChallengeVoteDrizzleGateway.deleteByChallengeAndVoter.challengeLookup",
            id: challengeIdStr,
            cause: error,
          }),
      });

      if (!challengeResult) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "Challenge", identifier: challengeIdStr }),
        );
      }

      // Verify write access for deleting votes
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

      // Delete the votes
      yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(challengeVotes)
            .where(
              and(
                eq(challengeVotes.challengeId, challengeIdStr),
                eq(challengeVotes.voterId, voterIdStr),
              ),
            );
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.deleteByChallengeAndVoter",
            id: `${challengeIdStr}:${voterIdStr}`,
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
            operation: "ChallengeVoteDrizzleGateway.countByChallengeId.challengeLookup",
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

      // Count votes
      const result = yield* Effect.tryPromise({
        try: async () => {
          const r = await self.db
            .select({ count: count() })
            .from(challengeVotes)
            .where(eq(challengeVotes.challengeId, challengeIdStr));
          return r[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "ChallengeVoteDrizzleGateway.countByChallengeId",
            id: challengeIdStr,
            cause: error,
          }),
      });

      return result;
    });
  }

  /**
   * Convert database record to domain interface
   */
  private toDomain(dbVote: ChallengeVoteSelect): ChallengeVote {
    return {
      id: ChallengeVoteId.create(dbVote.id),
      challengeId: ChallengeId.create(dbVote.challengeId),
      submissionId: ChallengeSubmissionId.create(dbVote.submissionId),
      voterId: UserId.unsafeCreate(dbVote.voterId),
      votePosition:
        dbVote.position === "UPVOTE"
          ? 1
          : dbVote.position === "DOWNVOTE"
            ? -1
            : 0,
      votePoints: dbVote.weight,
      normalizedWeight: dbVote.weight,
      votedAt: dbVote.createdAt,
    };
  }

  /**
   * Convert domain interface to database insert format
   */
  private toInsert(vote: ChallengeVote): ChallengeVoteInsert {
    return {
      id: ChallengeVoteId.toString(vote.id),
      challengeId: ChallengeId.toString(vote.challengeId),
      submissionId: ChallengeSubmissionId.toString(vote.submissionId),
      voterId: UserId.toString(vote.voterId),
      tripParticipantId: UserId.toString(vote.voterId),
      position:
        vote.votePosition > 0
          ? "UPVOTE"
          : vote.votePosition < 0
            ? "DOWNVOTE"
            : "NEUTRAL",
      weight: vote.votePoints,
      isStaffVote: false,
      createdAt: vote.votedAt,
      updatedAt: vote.votedAt,
    };
  }
}
