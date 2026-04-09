import type { ChallengeVoteRepository } from "@mirai-app/use-cases";
import type { ChallengeVote } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { ChallengeVoteMapper } from "../mappers/ChallengeVoteMapper";

// Type definitions for Prisma inputs/outputs
type PrismaChallengeVote = {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
};

type PrismaChallengeVoteCreateInput = {
  id: string;
  challengeId: string;
  submissionId: string;
  voterId: string;
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
  votedAt: Date;
};

type PrismaChallengeVoteUpdateInput = {
  votePosition: number;
  votePoints: number;
  normalizedWeight: number;
};

/**
 * Adapter to make ChallengeVoteMapper compatible with EntityMapper interface
 */
const ChallengeVoteMapperAdapter: EntityMapper<
  ChallengeVote,
  PrismaChallengeVote,
  PrismaChallengeVoteCreateInput,
  PrismaChallengeVoteUpdateInput
> = {
  toDomain: ChallengeVoteMapper.toDomain,
  toPrismaCreate: ChallengeVoteMapper.toPrismaCreate,
  toPrismaUpdate: ChallengeVoteMapper.toPrismaUpdate,
};

/**
 * PrismaChallengeVoteRepository
 *
 * Implements the ChallengeVoteRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const voteRepo = new PrismaChallengeVoteRepository(prisma);
 * const vote = await voteRepo.findById("vote-123");
 * ```
 */
export class PrismaChallengeVoteRepository
  extends BasePrismaRepository<
    ChallengeVote,
    PrismaChallengeVote,
    PrismaChallengeVoteCreateInput,
    PrismaChallengeVoteUpdateInput
  >
  implements ChallengeVoteRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.challengeVote }, ChallengeVoteMapperAdapter);
  }

  /**
   * Create multiple votes in a batch
   */
  async createMany(votes: ChallengeVote[]): Promise<ChallengeVote[]> {
    if (votes.length === 0) {
      return [];
    }

    // Prisma createMany doesn't return the created records, so we need a workaround
    const createdRecords = await this.prisma.$transaction(
      votes.map((vote) =>
        this.prisma.challengeVote.create({
          data: ChallengeVoteMapper.toPrismaCreate(vote),
        }),
      ),
    );

    return createdRecords.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes for a challenge
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeVote[]> {
    const records = await this.prisma.challengeVote.findMany({
      where: { challengeId },
      orderBy: { votePosition: "asc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes by a specific voter in a challenge
   */
  async findByChallengeAndVoter(
    challengeId: string,
    voterId: string,
  ): Promise<ChallengeVote[]> {
    const records = await this.prisma.challengeVote.findMany({
      where: { challengeId, voterId },
      orderBy: { votePosition: "asc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find all votes for a specific submission
   */
  async findBySubmissionId(submissionId: string): Promise<ChallengeVote[]> {
    const records = await this.prisma.challengeVote.findMany({
      where: { submissionId },
      orderBy: { votePosition: "asc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Check if a voter has already voted in a challenge
   */
  async hasVoted(challengeId: string, voterId: string): Promise<boolean> {
    const count = await this.prisma.challengeVote.count({
      where: { challengeId, voterId },
    });

    return count > 0;
  }

  /**
   * Check if a voter has voted for a specific position in a challenge
   */
  async hasVotedForPosition(
    challengeId: string,
    voterId: string,
    position: number,
  ): Promise<boolean> {
    const count = await this.prisma.challengeVote.count({
      where: { challengeId, voterId, votePosition: position },
    });

    return count > 0;
  }

  /**
   * Get vote positions filled by a voter in a challenge
   */
  async getVotedPositions(
    challengeId: string,
    voterId: string,
  ): Promise<number[]> {
    const votes = await this.prisma.challengeVote.findMany({
      where: { challengeId, voterId },
      select: { votePosition: true },
    });

    return votes.map((v) => v.votePosition);
  }

  /**
   * Delete all votes for a challenge (useful for testing/reset)
   */
  async deleteByChallengeId(challengeId: string): Promise<void> {
    await this.prisma.challengeVote.deleteMany({
      where: { challengeId },
    });
  }
}
