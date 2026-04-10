import type { SubmissionReport } from "@mirai-app/domain";
import type { SubmissionReportRepository } from "@mirai-app/use-cases";
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
 * const found = await repo.findById("report-123");
 * expect(found).not.toBeNull();
 *
 * const reports = await repo.findBySubmissionId("submission-456");
 * expect(reports).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemorySubmissionReportRepository
  extends InMemoryRepository<SubmissionReport>
  implements SubmissionReportRepository
{
  /**
   * Create a new submission report.
   * Stores the report using its ID as the key.
   */
  async create(report: SubmissionReport): Promise<SubmissionReport> {
    return this.createGeneric(report);
  }

  /**
   * Find a report by its ID.
   * @returns The report if found, null otherwise.
   */
  async findById(id: string): Promise<SubmissionReport | null> {
    return this.findByIdGeneric(id);
  }

  /**
   * Find all reports for a specific submission.
   * Returns reports sorted by creation date (newest first).
   */
  async findBySubmissionId(submissionId: string): Promise<SubmissionReport[]> {
    return this.getAllItems()
      .filter((report) => report.submissionId === submissionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find all reports filed by a specific reporter.
   * Returns reports sorted by creation date (newest first).
   */
  async findByReporterId(reporterId: string): Promise<SubmissionReport[]> {
    return this.getAllItems()
      .filter((report) => report.reporterId === reporterId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find reports by reason.
   * Performs case-insensitive comparison on the reason value.
   * Returns reports sorted by creation date (newest first).
   */
  async findByReason(reason: string): Promise<SubmissionReport[]> {
    const normalizedReason = reason.toUpperCase();
    return this.getAllItems()
      .filter((report) => report.reason.value === normalizedReason)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find all reports with optional pagination.
   * Returns reports sorted by creation date (newest first).
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<SubmissionReport[]> {
    let items = this.getAllItems().sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    if (options?.offset) {
      items = items.slice(options.offset);
    }

    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  /**
   * Count the number of reports for a specific submission.
   */
  async countBySubmissionId(submissionId: string): Promise<number> {
    return this.getAllItems().filter(
      (report) => report.submissionId === submissionId,
    ).length;
  }

  /**
   * Check if a reporter has already reported a specific submission.
   */
  async existsBySubmissionAndReporter(
    submissionId: string,
    reporterId: string,
  ): Promise<boolean> {
    return this.getAllItems().some(
      (report) =>
        report.submissionId === submissionId &&
        report.reporterId === reporterId,
    );
  }

  /**
   * Delete a report by its ID.
   */
  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  /**
   * Check if a report exists by its ID.
   */
  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }
}
