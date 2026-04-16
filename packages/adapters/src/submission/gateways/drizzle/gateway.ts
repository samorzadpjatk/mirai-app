import type {
  SubmissionReportGateway,
  SubmissionReportDTO,
  SubmissionReportConnectionArgs,
} from "@mirai-app/use-cases";
import type { Connection } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  submissionReports,
  tripParticipants,
  users,
  type SubmissionReportSelect,
  type SubmissionReportInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { SubmissionReportDrizzleMapper } from "../../mappers/drizzle/mapper";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find reports by submission ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findBySubmissionIdConnection(
    submissionId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      submissionId,
      args,
      () => eq(submissionReports.submissionId, submissionId),
      "findBySubmissionIdConnection",
    );
  }

  /**
   * Find reports by reporter ID with cursor-based pagination
   */
  findByReporterIdConnection(
    reporterId: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      reporterId,
      args,
      () => eq(submissionReports.reporterId, reporterId),
      "findByReporterIdConnection",
    );
  }

  /**
   * Find reports by reason with cursor-based pagination
   */
  findByReasonConnection(
    reason: string,
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      reason,
      args,
      () => eq(submissionReports.reason, reason),
      "findByReasonConnection",
    );
  }

  /**
   * Find all reports with cursor-based pagination
   */
  findManyConnection(
    args: SubmissionReportConnectionArgs,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      "all",
      args,
      undefined,
      "findManyConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) > (cursor.createdAt, cursor.id) WHERE clause
   * Uses ORDER BY createdAt, id with LIMIT first + 1
   */
  private executeConnectionQuery(
    filterValue: string,
    args: SubmissionReportConnectionArgs,
    buildFilterCondition: (() => ReturnType<typeof eq>) | undefined,
    operation: string,
  ): Effect.Effect<Connection<SubmissionReportDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions: Array<
          | ReturnType<typeof eq>
          | ReturnType<typeof and>
          | ReturnType<typeof sql>
        > = [];

        // Add filter condition if provided
        if (buildFilterCondition) {
          conditions.push(buildFilterCondition());
        }

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${submissionReports.createdAt}, ${submissionReports.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
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
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(asc(submissionReports.createdAt), asc(submissionReports.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

        // Build edges with cursors
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        }));

        return {
          edges,
          nodes: items,
          pageInfo: {
            hasNextPage: hasMore,
            hasPreviousPage: !!cursor,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation,
          message: `Failed to execute ${operation}`,
          cause: error,
        }),
    });
  }
}
