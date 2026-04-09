import type { ChallengeRepository } from "@mirai-app/use-cases";
import type {
  Challenge,
  ChallengeStatus,
  SubmissionType,
  ScoringCategory,
} from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { ChallengeMapper } from "../mappers/ChallengeMapper";

// Type definitions for Prisma inputs/outputs
type PrismaChallenge = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ChallengeCreateInput = {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
};

type ChallengeUpdateInput = {
  name: string;
  description: string | null;
  image: string | null;
  submissionType: string;
  scoringCategory: string;
  isRecurring: boolean;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  basePoints: number;
  firstPlacePoints: number | null;
  secondPlacePoints: number | null;
  thirdPlacePoints: number | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  votingStartTime: Date | null;
  votingEndTime: Date | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
  expectedValue: string | null;
  autoApprove: boolean;
};

/**
 * Adapter to make ChallengeMapper compatible with EntityMapper interface
 */
const ChallengeMapperAdapter: EntityMapper<
  Challenge,
  PrismaChallenge,
  ChallengeCreateInput,
  ChallengeUpdateInput
> = {
  toDomain: ChallengeMapper.toDomain,
  toPrismaCreate: ChallengeMapper.toPrismaCreate,
  toPrismaUpdate: ChallengeMapper.toPrismaUpdate,
};

/**
 * PrismaChallengeRepository
 *
 * Implements the ChallengeRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * Compatible with awilix-modular dependency injection.
 * Registered in RepositoryModule with singleton lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const challengeRepo = container.resolve("challengeRepository");
 *
 * // Manual instantiation (backward-compatible)
 * const challengeRepo = new PrismaChallengeRepository(prisma);
 * const challenge = await challengeRepo.findById("challenge-123");
 * ```
 */
export class PrismaChallengeRepository
  extends BasePrismaRepository<
    Challenge,
    PrismaChallenge,
    ChallengeCreateInput,
    ChallengeUpdateInput
  >
  implements ChallengeRepository
{
  /**
   * Creates a new PrismaChallengeRepository
   *
   * @param prisma - PrismaClient instance (injected by awilix or passed manually)
   */
  constructor(prisma: PrismaClient) {
    super(prisma, { model: prisma.challenge }, ChallengeMapperAdapter);
  }

  /**
   * Find challenges by trip ID
   */
  async findByTripId(tripId: string): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find challenges by status
   */
  async findByStatus(status: ChallengeStatus): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find challenges by trip ID and status
   */
  async findByTripIdAndStatus(
    tripId: string,
    status: ChallengeStatus,
  ): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { tripId, status },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find challenges by submission type
   */
  async findBySubmissionType(type: SubmissionType): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { submissionType: type },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find challenges by scoring category
   */
  async findByScoringCategory(category: ScoringCategory): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { scoringCategory: category },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find active challenges
   */
  async findActive(): Promise<Challenge[]> {
    return this.findByStatus("ACTIVE" as ChallengeStatus);
  }

  /**
   * Find challenges open for submission
   */
  async findOpenForSubmission(): Promise<Challenge[]> {
    const now = new Date();
    const records = await this.model.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ startTime: null }, { startTime: { lte: now } }],
        AND: [
          {
            OR: [{ endTime: null }, { endTime: { gte: now } }],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    const challenges = records.map((record) => this.mapper.toDomain(record));
    return challenges.filter((c) => c.isOpenForSubmission());
  }

  /**
   * Find recurring challenges
   */
  async findRecurring(): Promise<Challenge[]> {
    const records = await this.model.findMany({
      where: { isRecurring: true },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Update challenge status
   */
  async updateStatus(id: string, status: ChallengeStatus): Promise<Challenge> {
    const record = await this.model.update({
      where: { id },
      // Using type assertion since we're doing a partial update
      data: { status } as ChallengeUpdateInput,
    });
    return this.mapper.toDomain(record);
  }

  /**
   * Count challenges by trip ID
   */
  async countByTripId(tripId: string): Promise<number> {
    // Access count through the underlying model with type assertion
    return (
      this.model as unknown as {
        count(args?: { where?: Record<string, unknown> }): Promise<number>;
      }
    ).count({
      where: { tripId },
    });
  }
}
