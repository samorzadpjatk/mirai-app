import type {
  ChallengeSubmissionRepository,
  ChallengeSubmission,
  SubmissionId,
  SubmissionStatus,
} from "@repo/use-cases";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { ChallengeSubmissionMapper } from "../mappers/ChallengeSubmissionMapper";

// Type definitions for Prisma inputs/outputs
type PrismaChallengeSubmission = {
  id: string;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
  createdAt: Date;
  updatedAt: Date;
};

type ChallengeSubmissionCreateInput = {
  id: string;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
};

type ChallengeSubmissionUpdateInput = {
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  awardedPoints: number;
  bonusPoints: number;
  ranking: number | null;
  voteCount: number;
  voteScore: number;
};

/**
 * Adapter to make ChallengeSubmissionMapper compatible with EntityMapper interface
 */
const ChallengeSubmissionMapperAdapter: EntityMapper<
  ChallengeSubmission,
  PrismaChallengeSubmission,
  ChallengeSubmissionCreateInput,
  ChallengeSubmissionUpdateInput
> = {
  toDomain: ChallengeSubmissionMapper.toDomain,
  toPrismaCreate: ChallengeSubmissionMapper.toPrismaCreate,
  toPrismaUpdate: ChallengeSubmissionMapper.toPrismaUpdate,
};

/**
 * PrismaChallengeSubmissionRepository
 *
 * Implements the ChallengeSubmissionRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const submissionRepo = new PrismaChallengeSubmissionRepository(prisma);
 * const submission = await submissionRepo.findById("submission-123");
 * ```
 */
export class PrismaChallengeSubmissionRepository
  extends BasePrismaRepository<
    ChallengeSubmission,
    PrismaChallengeSubmission,
    ChallengeSubmissionCreateInput,
    ChallengeSubmissionUpdateInput
  >
  implements ChallengeSubmissionRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.challengeSubmission },
      ChallengeSubmissionMapperAdapter,
    );
  }

  /**
   * Find submission by challenge ID and group ID (unique constraint)
   */
  async findByChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<ChallengeSubmission | null> {
    const record = await this.model.findUnique({
      where: {
        challengeId_groupId: {
          challengeId,
          groupId,
        },
      },
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find submissions by challenge ID
   */
  async findByChallengeId(challengeId: string): Promise<ChallengeSubmission[]> {
    const records = await this.model.findMany({
      where: { challengeId },
      orderBy: { voteScore: "desc", createdAt: "asc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by group ID
   */
  async findByGroupId(groupId: string): Promise<ChallengeSubmission[]> {
    const records = await this.model.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: SubmissionStatus): Promise<ChallengeSubmission[]> {
    const records = await this.model.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find submissions with filtering and pagination options
   */
  async findMany(params: {
    challengeId?: string;
    groupId?: string;
    status?: SubmissionStatus;
    orderBy?: "voteScore" | "createdAt";
    orderDirection?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }): Promise<ChallengeSubmission[]> {
    const where: {
      challengeId?: string;
      groupId?: string;
      status?: string;
    } = {};

    if (params.challengeId) {
      where.challengeId = params.challengeId;
    }
    if (params.groupId) {
      where.groupId = params.groupId;
    }
    if (params.status) {
      where.status = params.status;
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (params.orderBy === "voteScore") {
      orderBy.voteScore = params.orderDirection ?? "desc";
    }
    orderBy.createdAt = params.orderDirection ?? "asc";

    const records = await this.model.findMany({
      where,
      orderBy,
      take: params.limit,
      skip: params.offset,
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Check if submission exists for challenge and group
   */
  async existsForChallengeAndGroup(
    challengeId: string,
    groupId: string,
  ): Promise<boolean> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    const count = await this.model.count({
      where: {
        challengeId,
        groupId,
      },
    });
    return count > 0;
  }

  /**
   * Count submissions by challenge ID
   */
  async countByChallengeId(challengeId: string): Promise<number> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    return this.model.count({
      where: { challengeId },
    });
  }

  /**
   * Count submissions by challenge and status
   */
  async countByChallengeAndStatus(
    challengeId: string,
    status: SubmissionStatus,
  ): Promise<number> {
    // @ts-expect-error - count method not in base type but available on Prisma model
    return this.model.count({
      where: {
        challengeId,
        status,
      },
    });
  }
}
