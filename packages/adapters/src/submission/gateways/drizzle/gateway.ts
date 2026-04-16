import type {
  SubmissionReportGateway,
  SubmissionReportDTO,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  submissionReports,
  tripParticipants,
  users,
  type SubmissionReportSelect,
  type SubmissionReportInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { SubmissionReportDrizzleMapper } from "../../mappers/drizzle/mapper";

/**
 * DrizzleSubmissionReportGateway
 *
 * Implements the SubmissionReportGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * Returns SubmissionReportDTOs instead of domain entities.
 * Follows the UserGateway pattern.
 */
export class DrizzleSubmissionReportGateway
  extends BaseDrizzleGateway<
    SubmissionReportDTO,
    SubmissionReportSelect,
    SubmissionReportInsert,
    typeof submissionReports
  >
  implements SubmissionReportGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: submissionReports,
      mapper: SubmissionReportDrizzleMapper.instance,
    });
  }

  /**
   * Find reports by submission ID
   */
  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            status: submissionReports.status,
            reviewedById: submissionReports.reviewedById,
            reviewedAt: submissionReports.reviewedAt,
            createdAt: submissionReports.createdAt,
            updatedAt: submissionReports.updatedAt,
          })
          .from(submissionReports)
          .where(eq(submissionReports.submissionId, submissionId))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findBySubmissionId",
          message: `Failed to find submission reports by submission ID ${submissionId}`,
          cause: error,
        }),
    });
  }

  /**
   * Find reports by reporter ID
   */
  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            status: submissionReports.status,
            reviewedById: submissionReports.reviewedById,
            reviewedAt: submissionReports.reviewedAt,
            createdAt: submissionReports.createdAt,
            updatedAt: submissionReports.updatedAt,
          })
          .from(submissionReports)
          .where(eq(submissionReports.reporterId, reporterId))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByReporterId",
          message: `Failed to find submission reports by reporter ID ${reporterId}`,
          cause: error,
        }),
    });
  }

  /**
   * Find reports by reason
   */
  findByReason(
    reason: string,
  ): Effect.Effect<SubmissionReportDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            status: submissionReports.status,
            reviewedById: submissionReports.reviewedById,
            reviewedAt: submissionReports.reviewedAt,
            createdAt: submissionReports.createdAt,
            updatedAt: submissionReports.updatedAt,
          })
          .from(submissionReports)
          .where(eq(submissionReports.reason, reason))
          .orderBy(desc(submissionReports.createdAt));

        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByReason",
          message: `Failed to find submission reports by reason ${reason}`,
          cause: error,
        }),
    });
  }

  /**
   * Override findById to return DTO
   */
  override findById(
    id: string,
  ): Effect.Effect<SubmissionReportDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            status: submissionReports.status,
            reviewedById: submissionReports.reviewedById,
            reviewedAt: submissionReports.reviewedAt,
            createdAt: submissionReports.createdAt,
            updatedAt: submissionReports.updatedAt,
          })
          .from(submissionReports)
          .where(eq(submissionReports.id, id))
          .limit(1);

        if (!record) return null;

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed to find submission report by ID ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Find all reports with pagination
   * Note: This implements the SubmissionReportGateway interface requirement
   * for paginated results. The base class findAll returns array, but
   * the interface requires paginated result - we satisfy the interface.
   */
  // @ts-expect-error - Intentionally different return type from base class to satisfy interface
  findAll(options?: { limit?: number; offset?: number }): Effect.Effect<
    {
      items: SubmissionReportDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        // Build base query
        const buildQuery = () => {
          let query = this.db
            .select({
              id: submissionReports.id,
              submissionId: submissionReports.submissionId,
              reporterId: submissionReports.reporterId,
              reason: submissionReports.reason,
              details: submissionReports.details,
              status: submissionReports.status,
              reviewedById: submissionReports.reviewedById,
              reviewedAt: submissionReports.reviewedAt,
              createdAt: submissionReports.createdAt,
              updatedAt: submissionReports.updatedAt,
            })
            .from(submissionReports)
            .orderBy(desc(submissionReports.createdAt));
          return query;
        };

        let query = buildQuery();

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports);
        const total = countResult?.count ?? 0;

        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        if (limit) {
          query = query.limit(limit) as unknown as typeof query;
        }
        if (offset) {
          query = query.offset(offset) as unknown as typeof query;
        }

        const records = await query;
        const items = records.map((r) => this.mapper.toDTO(r));

        // Calculate hasMore: if we requested items and got a full page, there might be more
        const hasMore = items.length === limit && offset + items.length < total;

        return {
          items,
          total,
          limit,
          offset,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find all submission reports",
          cause: error,
        }),
    });
  }

  /**
   * Count reports for a submission
   */
  countBySubmissionId(
    submissionId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports)
          .where(eq(submissionReports.submissionId, submissionId))
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countBySubmissionId",
          message: `Failed to count submission reports for submission ${submissionId}`,
          cause: error,
        }),
    });
  }

  /**
   * Check if a reporter has already reported a submission
   */
  existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports)
          .where(
            and(
              eq(submissionReports.submissionId, submissionId),
              eq(submissionReports.reporterId, reporterId),
            ),
          )
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsBySubmissionAndReporter",
          message: "Failed to check if submission report exists",
          cause: error,
        }),
    });
  }

  /**
   * Create a new submission report (overrides base implementation)
   */
  override create(
    report: SubmissionReportDTO,
  ): Effect.Effect<SubmissionReportDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insert = this.mapper.toDrizzleInsert(report);
        await this.db.insert(submissionReports).values(insert);
        return report;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create submission report",
          cause: error,
        }),
    });
  }

  /**
   * Delete a report (overrides base implementation)
   */
  override delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(submissionReports)
          .where(eq(submissionReports.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: `Failed to delete submission report ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Check if report exists (overrides base implementation)
   */
  override exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(submissionReports)
          .where(eq(submissionReports.id, id))
          .limit(1);

        return (result?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "exists",
          message: `Failed to check if submission report ${id} exists`,
          cause: error,
        }),
    });
  }

  /**
   * Update report status
   */
  updateStatus(
    id: string,
    status: string,
    reviewedById: string,
  ): Effect.Effect<SubmissionReportDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const reviewedAt = new Date();
        await this.db
          .update(submissionReports)
          .set({
            status,
            reviewedById,
            reviewedAt,
            updatedAt: new Date(),
          })
          .where(eq(submissionReports.id, id));

        // Fetch the updated record
        const [record] = await this.db
          .select({
            id: submissionReports.id,
            submissionId: submissionReports.submissionId,
            reporterId: submissionReports.reporterId,
            reason: submissionReports.reason,
            details: submissionReports.details,
            status: submissionReports.status,
            reviewedById: submissionReports.reviewedById,
            reviewedAt: submissionReports.reviewedAt,
            createdAt: submissionReports.createdAt,
            updatedAt: submissionReports.updatedAt,
          })
          .from(submissionReports)
          .where(eq(submissionReports.id, id))
          .limit(1);

        if (!record) {
          throw new Error(`Report with id ${id} not found after update`);
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update status for submission report ${id}`,
          cause: error,
        }),
    });
  }
}
