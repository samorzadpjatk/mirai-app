import { ReportReason } from "@mirai-app/domain";
import type { SubmissionReportDTO } from "@mirai-app/use-cases";
import type { DrizzleEntityMapper } from "../../../system/shared/gateways/drizzle-base";
import {
  submissionReports,
  type SubmissionReportSelect,
  type SubmissionReportInsert,
} from "@mirai-app/frameworks/drizzle/schema";

/**
 * SubmissionReportDrizzleMapper
 *
 * Maps between Drizzle database records and SubmissionReportDTOs.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 * Follows the UserGateway pattern - returns DTOs instead of domain entities.
 */
export class SubmissionReportDrizzleMapper implements DrizzleEntityMapper<
  SubmissionReportDTO,
  SubmissionReportSelect,
  SubmissionReportInsert
> {
  /**
   * Convert a Drizzle SubmissionReport record to a SubmissionReportDTO
   */
  toDTO(record: SubmissionReportSelect): SubmissionReportDTO {
    return {
      id: record.id,
      submissionId: record.submissionId,
      reporterId: record.reporterId,
      reason: ReportReason.unsafeCreate(record.reason),
      description: record.details ?? null,
      status: record.status ?? "PENDING",
      reviewedById: record.reviewedById ?? null,
      reviewedAt: record.reviewedAt ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt ?? record.createdAt,
    };
  }

  /**
   * Convert a Drizzle SubmissionReport record to a DTO
   * (implements DrizzleEntityMapper interface requirement)
   */
  toDomain(
    record: SubmissionReportSelect & {
      participantId?: string | null;
      userId?: string | null;
      userFirstName?: string | null;
      userLastName?: string | null;
      userHasAvatar?: boolean | null;
    },
  ): SubmissionReportDTO {
    return this.toDTO(record);
  }

  /**
   * Convert a SubmissionReportDTO to Drizzle insert input
   */
  toDrizzleInsert(dto: SubmissionReportDTO): SubmissionReportInsert {
    return {
      id: dto.id,
      submissionId: dto.submissionId,
      reporterId: dto.reporterId,
      reason: dto.reason.value,
      details: dto.description,
      status: dto.status,
      reviewedById: dto.reviewedById,
      reviewedAt: dto.reviewedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert a SubmissionReportDTO to Drizzle update input
   */
  toDrizzleUpdate(dto: SubmissionReportDTO): Partial<SubmissionReportInsert> {
    return {
      details: dto.description,
      status: dto.status,
      reviewedById: dto.reviewedById,
      reviewedAt: dto.reviewedAt,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial DTO from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<SubmissionReportSelect>,
  ): Partial<SubmissionReportDTO> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.submissionId) partial.submissionId = record.submissionId;
    if (record.reporterId) partial.reporterId = record.reporterId;
    if (record.reason)
      partial.reason = ReportReason.unsafeCreate(record.reason);
    if (record.details !== undefined) partial.description = record.details;
    if (record.status) partial.status = record.status;
    if (record.reviewedById !== undefined)
      partial.reviewedById = record.reviewedById;
    if (record.reviewedAt !== undefined) partial.reviewedAt = record.reviewedAt;
    if (record.createdAt) partial.createdAt = record.createdAt;
    if (record.updatedAt) partial.updatedAt = record.updatedAt;
    return partial as Partial<SubmissionReportDTO>;
  }

  static readonly instance = new SubmissionReportDrizzleMapper();
}
