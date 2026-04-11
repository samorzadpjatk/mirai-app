import type { Result } from "@mirai-app/domain";
import { ok, err, SubmissionReport } from "@mirai-app/domain";
import type { SubmissionReportRepository } from "../ports/SubmissionReportRepository";

/**
 * Input for CreateReport use case
 */
export interface CreateReportInput {
  submissionId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
}

/**
 * Output DTO for CreateReport use case
 */
export interface CreateReportOutput {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  reasonDisplay: string;
  details: string | null;
  createdAt: Date;
}

/**
 * CreateReport Use Case
 *
 * Creates a new submission report.
 * Returns error if validation fails.
 */
export class CreateReportUseCase {
  constructor(private reportRepository: SubmissionReportRepository) {}

  async execute(
    input: CreateReportInput,
  ): Promise<Result<CreateReportOutput, string>> {
    // Check if reporter already reported this submission
    const alreadyExists =
      await this.reportRepository.existsBySubmissionAndReporter(
        input.submissionId,
        input.reporterId,
      );

    if (alreadyExists) {
      return err("You have already reported this submission");
    }

    // Create domain entity
    const reportResult = SubmissionReport.create({
      submissionId: input.submissionId,
      reporterId: input.reporterId,
      reason: input.reason,
      ...(input.details !== undefined && { details: input.details }),
    });

    if (reportResult.kind === "err") {
      return err(reportResult.error);
    }

    // Persist report
    const saved = await this.reportRepository.create(reportResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(report: SubmissionReport): CreateReportOutput {
    return {
      id: report.id,
      submissionId: report.submissionId,
      reporterId: report.reporterId,
      reason: report.reason.value,
      reasonDisplay: report.getReasonDisplay(),
      details: report.details,
      createdAt: report.createdAt,
    };
  }
}
