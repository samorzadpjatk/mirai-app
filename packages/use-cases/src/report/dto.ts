/**
 * Report DTOs
 *
 * Data Transfer Objects for Report domain.
 * Used by use-case gateways to return data to the presentation layer.
 */

import type { PaginatedResult } from "../system/shared/dto";
import type { ReportReason, ReportStatus } from "@mirai-app/domain";

/**
 * SubmissionReportDTO - Lightweight representation of a submission report
 */
export interface SubmissionReportDTO {
  id: string;
  submissionId: string;
  reporterId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated result for report queries
 */
export type ReportPaginatedResult = PaginatedResult<SubmissionReportDTO>;
