import type {
  SubmissionReportId,
  ChallengeSubmissionId,
  UserId,
} from "@mirai-app/domain";

/**
 * DTO for submission report
 */
export interface SubmissionReportDTO {
  id: SubmissionReportId;
  submissionId: ChallengeSubmissionId;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
}

/**
 * DTO for reporter user info
 */
export interface ReporterUserDTO {
  id: UserId;
  firstName: string;
  lastName: string;
  email: string | null;
}

/**
 * DTO for reporter info
 */
export interface ReporterDTO {
  id: string;
  user: ReporterUserDTO;
}

/**
 * DTO for submission report with reporter info
 */
export interface SubmissionReportWithReporterDTO {
  id: SubmissionReportId;
  submissionId: ChallengeSubmissionId;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
  reporter: ReporterDTO | null;
}

/**
 * DTO for creating a submission report
 */
export interface CreateSubmissionReportInputDTO {
  tripId: string;
  submissionId: string;
  reporterId: string;
  reason: string;
  details?: string;
}

/**
 * DTO for submission report creation result
 */
export interface CreateSubmissionReportResultDTO {
  id: SubmissionReportId;
  submissionId: ChallengeSubmissionId;
  reporterId: string;
  reason: string;
  details: string | null;
  createdAt: Date;
  reporter: ReporterDTO | null;
}

/**
 * DTO for getting reports by submission
 */
export interface GetReportsBySubmissionInputDTO {
  submissionId: string;
}

/**
 * DTO for reports by submission result
 */
export interface GetReportsBySubmissionResultDTO {
  reports: SubmissionReportWithReporterDTO[];
}
