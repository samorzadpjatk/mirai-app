import { Effect } from "effect";
import { eq, count, and, inArray } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  challengeVotes,
  type ChallengeVoteSelect,
  type ChallengeVoteInsert,
} from "@mirai-app/frameworks/drizzle";
import { DatabaseError } from "@mirai-app/domain";
import type {
  IChallengeVotePort,
  ChallengeVote,
} from "@mirai-app/use-cases/challenge-vote/ports/ChallengeVotePort";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * ChallengeVote Drizzle Gateway
 *
 * Implements IChallengeVotePort using Drizzle ORM for database operations.
 */
export class ChallengeVoteDrizzleGateway
  extends BaseDrizzleGateway
  implements IChallengeVotePort
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
          .from(challengeVotes)
          .where(eq(challengeVotes.id, id))
          .limit(1);
        return result[0] ?? null;
      },
      id,
    ).pipe(
      Effect.map((dbVote: ChallengeVoteSelect | null) =>
        dbVote ? this.toDomain(dbVote) : null,
      ),
    );
  }

  findByChallengeId(challengeId: string) {
    return this.tryPromise(
      "findByChallengeId",
      async () => {
        const results = await this.db
          .select()
          .from(challengeVotes)
          .where(eq(challengeVotes.challengeId, challengeId))
          .orderBy(challengeVotes.createdAt);
        return results;
      },
      challengeId,
    ).pipe(
      Effect.map((dbVotes: ChallengeVoteSelect[]) =>
        dbVotes.map((dbVote) => this.toDomain(dbVote)),
      ),
    );
  }

  findByChallengeAndVoter(challengeId: string, voterId: string) {
    return this.tryPromise(
      "findByChallengeAndVoter",
      async () => {
        const results = await this.db
          .select()
          .from(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          )
          .orderBy(challengeVotes.createdAt);
        return results;
      },
      `${challengeId}:${voterId}`,
    ).pipe(
      Effect.map((dbVotes: ChallengeVoteSelect[]) =>
        dbVotes.map((dbVote) => this.toDomain(dbVote)),
      ),
    );
  }

  create(vote: ChallengeVote) {
    const insertData = this.toInsert(vote);
    return this.tryPromise(
      "create",
      async () => {
        const [result] = await this.db
          .insert(challengeVotes)
          .values(insertData)
          .returning();
        if (!result) throw new Error("Failed to create challenge vote");
        return result;
      },
      vote.id,
    ).pipe(Effect.map((dbVote: ChallengeVoteSelect) => this.toDomain(dbVote)));
  }

  createMany(votes: ChallengeVote[]) {
    if (votes.length === 0) {
      return Effect.succeed([]);
    }

    const insertData = votes.map((vote) => this.toInsert(vote));
    return this.tryPromise(
      "createMany",
      async () => {
        const results = await this.db
          .insert(challengeVotes)
          .values(insertData)
          .returning();
        return results;
      },
      `${votes.length} votes`,
    ).pipe(
      Effect.map((dbVotes: ChallengeVoteSelect[]) =>
        dbVotes.map((dbVote) => this.toDomain(dbVote)),
      ),
    );
  }

  delete(id: string) {
    return this.tryPromise(
      "delete",
      async () => {
        await this.db.delete(challengeVotes).where(eq(challengeVotes.id, id));
      },
      id,
    );
  }

  deleteByChallengeAndVoter(challengeId: string, voterId: string) {
    return this.tryPromise(
      "deleteByChallengeAndVoter",
      async () => {
        await this.db
          .delete(challengeVotes)
          .where(
            and(
              eq(challengeVotes.challengeId, challengeId),
              eq(challengeVotes.voterId, voterId),
            ),
          );
      },
      `${challengeId}:${voterId}`,
    );
  }

  countByChallengeId(challengeId: string) {
    return this.tryPromise(
      "countByChallengeId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(challengeVotes)
          .where(eq(challengeVotes.challengeId, challengeId));
        return result[0]?.count ?? 0;
      },
      challengeId,
    );
  }

  /**
   * Convert database record to domain interface
   */
  private toDomain(dbVote: ChallengeVoteSelect): ChallengeVote {
    return {
      id: dbVote.id,
      challengeId: dbVote.challengeId,
      submissionId: dbVote.submissionId,
      voterId: dbVote.voterId,
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
      id: vote.id,
      challengeId: vote.challengeId,
      submissionId: vote.submissionId,
      voterId: vote.voterId,
      tripParticipantId: vote.voterId,
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
