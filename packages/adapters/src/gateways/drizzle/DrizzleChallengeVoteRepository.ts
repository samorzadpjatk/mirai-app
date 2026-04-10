import type { ChallengeVoteRepository } from "@mirai-app/use-cases";
import type { ChallengeVote } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { challengeVotes } from "@mirai-app/frameworks/drizzle/schema/challenge";
import { eq, and, asc, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { ChallengeVoteDrizzleMapper } from "../../mappers/drizzle/challenge-vote";

/**
 * DrizzleChallengeVoteRepository
 *
 * Implements the ChallengeVoteRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleChallengeVoteRepository
  extends BaseDrizzleRepository<
    ChallengeVote,
    typeof challengeVotes.$inferSelect,
    Partial<typeof challengeVotes.$inferInsert>,
    Partial<typeof challengeVotes.$inferInsert>
  >
  implements ChallengeVoteRepository
{
  constructor(db: DrizzleDb) {
    super(db, { table: challengeVotes }, ChallengeVoteDrizzleMapper.instance);
  }

  /**
   * Create multiple votes in a batch
   */
  async createMany(votes: ChallengeVote[]): Promise<ChallengeVote[]> {
    if (votes.length === 0) {
      return [];
    }

    const createdRecords = await this.db.transaction(async (tx) => {
      const results = [];
      for (const vote of votes) {
        const [inserted] = await tx
          .insert(challengeVotes)
          .values({
            id: vote.id as string,
            challengeId: vote.challengeId,
            submissionId: vote.submissionId,
            voterId: vote.voterId,
            tripParticipantId: (vote as any).tripParticipantId ?? vote.voterId,
            position: vote.position as "UPVOTE" | "DOWNVOTE" | "NEUTRAL",
            weight: vote.weight,
            isStaffVote: vote.isStaffVote,
            createdAt: vote.votedAt,
            updatedAt: vote.votedAt,
          })
          .returning();
        results.push(inserted);
      }
      return results;
    });

    return createdRecords.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes for a challenge
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeVote[]> {
    const records = await this.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.challengeId, challengeId))
      .orderBy(asc(challengeVotes.position));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes by a specific voter in a challenge
   */
  async findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Promise<ChallengeVote[]> {
    const records = await this.db
      .select()
      .from(challengeVotes)
      .where(
        and(
          eq(challengeVotes.challengeId, challengeId),
          eq(challengeVotes.voterId, voterId),
        ),
      )
      .orderBy(asc(challengeVotes.position));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes for a specific submission
   */
  async findBySubmissionId(submissionId: string): Promise<ChallengeVote[]> {
    const records = await this.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, submissionId))
      .orderBy(asc(challengeVotes.position));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Check if a voter has already voted in a challenge
   */
  async hasVoted(challengeId: string, voterId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(challengeVotes)
      .where(
        and(
          eq(challengeVotes.challengeId, challengeId),
          eq(challengeVotes.voterId, voterId),
        ),
      )
      .limit(1);

    return (result?.count ?? 0) > 0;
  }

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  async hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Promise<boolean> {
    // Note: position field is stored as enum in Drizzle schema, not number
    // This method may need adjustment based on actual schema
    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(challengeVotes)
      .where(
        and(
          eq(challengeVotes.challengeId, challengeId),
          eq(challengeVotes.voterId, voterId),
        ),
      )
      .limit(1);

    return (result?.count ?? 0) > 0;
  }

  /**
   * Get vote positions filled by a voter in a challenge
   */
  async getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Promise<number[]> {
    const votes = await this.db
      .select({ position: challengeVotes.position })
      .from(challengeVotes)
      .where(
        and(
          eq(challengeVotes.challengeId, challengeId),
          eq(challengeVotes.voterId, voterId),
        ),
      );

    // Convert enum positions to numbers
    return votes.map((v) => {
      switch (v.position) {
        case "UPVOTE":
          return 1;
        case "DOWNVOTE":
          return -1;
        default:
          return 0;
      }
    });
  }

  /**
   * Delete all votes for a challenge
   */
  async deleteByChallengeId(challengeId: string): Promise<void> {
    await this.db
      .delete(challengeVotes)
      .where(eq(challengeVotes.challengeId, challengeId));
  }
}
