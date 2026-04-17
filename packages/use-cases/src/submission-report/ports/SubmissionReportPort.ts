import { Context, Effect } from "effect";
import type {
  IPortError,
  SubmissionReportId,
  ChallengeSubmissionId,
} from "@mirai-app/domain";

/**
 * SubmissionReport entity interface for use cases
 */
export interface SubmissionReport {
  id: SubmissionReportId;
  submissionId: ChallengeSubmissionId;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
}

/**
 * SubmissionReport with reporter info
 */
export interface SubmissionReportWithReporter extends SubmissionReport {
  reporter: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      authUserId: string | null;
    };
  } | null;
}

/**
 * SubmissionReport Port - Repository interface with Context.Tag for Effect DI
 */
export interface ISubmissionReportPort {
  /**
   * Find report by ID
   */
  findById(
    id: SubmissionReportId,
  ): Effect.Effect<SubmissionReport | null, IPortError, never>;

  /**
   * Find all reports for a submission
   */
  findBySubmissionId(
    submissionId: ChallengeSubmissionId,
  ): Effect.Effect<SubmissionReportWithReporter[], IPortError, never>;

  /**
   * Create a new report
   */
  create(
    report: Omit<SubmissionReport, "id" | "createdAt">,
  ): Effect.Effect<SubmissionReport, IPortError, never>;

  /**
   * Check if user already reported a submission
   */
  existsBySubmissionAndReporter(
    submissionId: ChallengeSubmissionId,
    reporterId: string,
  ): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count reports for a submission
   */
  countBySubmissionId(
    submissionId: ChallengeSubmissionId,
  ): Effect.Effect<number, IPortError, never>;
}

/**
 * Context.Tag for SubmissionReportPort
 */
export class SubmissionReportPortTag extends Context.Tag(
  "SubmissionReportPort",
)<SubmissionReportPortTag, ISubmissionReportPort>() {}
