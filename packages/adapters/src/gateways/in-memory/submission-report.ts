import type { SubmissionReport } from "@mirai-app/domain";
import type { SubmissionReportRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Submission Report Repository for Testing
 *
 * Implements SubmissionReportRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const repo = new InMemorySubmissionReportRepository();
 * repo.seed([mockReport]);
 *
 * const found = await Effect.runPromise(repo.findById("report-123"));
 * expect(found).not.toBeNull();
 *
 * const reports = await Effect.runPromise(repo.findBySubmissionId("submission-456"));
 * expect(reports).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemorySubmissionReportRepository
  extends InMemoryRepository<SubmissionReport>
  implements SubmissionReportRepository
{
  create(
    report: SubmissionReport,
  ): Effect.Effect<SubmissionReport, never, never> {
    return this.createGeneric(report);
  }

  findById(id: string): Effect.Effect<SubmissionReport | null, never, never> {
    return this.findByIdGeneric(id);
  }

  findBySubmissionId(
    submissionId: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.submissionId === submissionId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByReporterId(
    reporterId: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.reporterId === reporterId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByReason(
    reason: string,
  ): Effect.Effect<SubmissionReport[], never, never> {
    const normalizedReason = reason.toUpperCase();
    return Effect.succeed(
      this.getAllItems()
        .filter((report) => report.reason.value === normalizedReason)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SubmissionReport[], never, never> {
    let items = this.getAllItems().sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    if (options?.offset) {
      items = items.slice(options.offset);
    }

    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return Effect.succeed(items);
  }

  countBySubmissionId(
    submissionId: string,
  ): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (report) => report.submissionId === submissionId,
      ).length,
    );
  }

  existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (report) =>
          report.submissionId === submissionId &&
          report.reporterId === reporterId,
      ),
    );
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return this.existsGeneric(id);
  }
}
