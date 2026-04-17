import type {
  ChallengeSubmissionId,
  SubmissionReportId,
  TripId,
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
 * DTO for submission report with reporter info
 */
export interface SubmissionReportWithReporterDTO extends SubmissionReportDTO {
  reporter: {
    id: string;
    user: {
      id: UserId;
      firstName: string;
      lastName: string;
      email: string | null;
    };
  } | null;
}

/**
 * DTO for submission report with submission info
 */
export interface SubmissionReportWithSubmissionDTO extends SubmissionReportDTO {
  submission: {
    id: ChallengeSubmissionId;
    challengeId: string;
    groupId: string;
    status: string;
  } | null;
}

/**
 * DTO for paginated submission reports
 */
export interface PaginatedSubmissionReportsDTO {
  reports: SubmissionReportWithReporterDTO[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * DTO for submission report creation result
 */
export interface CreateSubmissionReportResultDTO {
  id: SubmissionReportId;
  submissionId: ChallengeSubmissionId;
  reporterId: string;
  reason: string;
  createdAt: Date;
}

/**
 * DTO for submission report statistics
 */
export interface SubmissionReportStatsDTO {
  submissionId: ChallengeSubmissionId;
  totalReports: number;
  uniqueReporters: number;
  latestReportAt: Date | null;
}
