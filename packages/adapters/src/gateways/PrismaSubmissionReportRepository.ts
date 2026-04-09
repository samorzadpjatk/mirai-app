import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import type { SubmissionReport } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { SubmissionReportMapper } from "../mappers/SubmissionReportMapper";

// Type definitions for Prisma inputs/outputs
type PrismaSubmissionReport = {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
  reporter?: {
    id: string;
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      authUserId: string | null;
      hasAvatar: boolean;
    } | null;
  } | null;
};

type PrismaSubmissionReportCreateInput = {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
};

type PrismaSubmissionReportUpdateInput = {
  details: string | null;
};

// Include config for reporter info
const REPORTER_INCLUDE = {
  reporter: {
    include: {
      user: true,
    },
  },
};

/**
 * Adapter to make SubmissionReportMapper compatible with EntityMapper interface
 */
const SubmissionReportMapperAdapter: EntityMapper<
  SubmissionReport,
  PrismaSubmissionReport,
  PrismaSubmissionReportCreateInput,
  PrismaSubmissionReportUpdateInput
> = {
  toDomain: SubmissionReportMapper.toDomain,
  toPrismaCreate: SubmissionReportMapper.toPrismaCreate,
  toPrismaUpdate: SubmissionReportMapper.toPrismaUpdate,
};

/**
 * PrismaSubmissionReportRepository
 *
 * Implements the SubmissionReportRepository port using Prisma ORM.
 * Uses BasePrismaRepository for standard CRUD operations.
 *
 * @example
 * ```typescript
 * const reportRepo = new PrismaSubmissionReportRepository(prisma);
 * const reports = await reportRepo.findBySubmissionId("submission-123");
 * ```
 */
export class PrismaSubmissionReportRepository
  extends BasePrismaRepository<
    SubmissionReport,
    PrismaSubmissionReport,
    PrismaSubmissionReportCreateInput,
    PrismaSubmissionReportUpdateInput
  >
  implements SubmissionReportRepository
{
  constructor(prisma: PrismaClient) {
    super(
      prisma,
      { model: prisma.submissionReport },
      SubmissionReportMapperAdapter,
    );
  }

  /**
   * Find reports by submission ID
   */
  async findBySubmissionId(submissionId: string): Promise<SubmissionReport[]> {
    const records = await this.model.findMany({
      where: { submissionId },
      include: REPORTER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find reports by reporter ID
   */
  async findByReporterId(reporterId: string): Promise<SubmissionReport[]> {
    const records = await this.model.findMany({
      where: { reporterId },
      include: REPORTER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find reports by reason
   */
  async findByReason(reason: string): Promise<SubmissionReport[]> {
    const records = await this.model.findMany({
      where: { reason: { equals: reason, mode: "insensitive" } },
      include: REPORTER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Override findById to include reporter info
   */
  async findById(id: string): Promise<SubmissionReport | null> {
    const record = await this.model.findUnique({
      where: { id },
      include: REPORTER_INCLUDE,
    });

    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Override findAll to include reporter info
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<SubmissionReport[]> {
    const records = await this.model.findMany({
      take: options?.limit,
      skip: options?.offset,
      include: REPORTER_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Count reports for a submission
   */
  async countBySubmissionId(submissionId: string): Promise<number> {
    return this.model.count({
      where: { submissionId },
    });
  }

  /**
   * Check if a reporter has already reported a submission
   */
  async existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Promise<boolean> {
    const count = await this.model.count({
      where: { submissionId, reporterId },
    });

    return count > 0;
  }
}
