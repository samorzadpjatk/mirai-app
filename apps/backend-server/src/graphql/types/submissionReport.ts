/**
 * SubmissionReport GraphQL Types
 *
 * Pothos type definitions for SubmissionReport domain.
 * Maps from use case DTOs to GraphQL schema types.
 *
 * ## Types
 *
 * - SubmissionReportUserInfo: Reporter user info
 * - SubmissionReportReporterInfo: Reporter with participant details
 * - SubmissionReport: Main report type
 * - SubmissionReportCreateResult: Result from create mutation
 * - SubmissionReportListResult: Paginated list of reports
 *
 * @module SubmissionReport/types
 */

import { builder } from "../builder";
import type {
  CreateReportOutput,
  GetReportsOutput,
  ReportOutput,
  ReporterOutput,
} from "@mirai-app/use-cases";

// =============================================================================
// Enums
// =============================================================================

/**
 * Report reason enum
 *
 * Standard reasons for reporting a submission.
 */
export const ReportReasonEnum = builder.enumType("ReportReason", {
  description: "Standard reasons for reporting a submission",
  values: [
    "INAPPROPRIATE",
    "CHEATING",
    "SPAM",
    "WRONG_SUBMISSION",
    "OTHER",
  ] as const,
});

// =============================================================================
// Embedded Types
// =============================================================================

/**
 * User information for reporter
 */
export const SubmissionReportUserInfoType = builder.objectType(
  "SubmissionReportUserInfo",
  {
    description: "User information for a reporter",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "User ID",
        nullable: false,
      }),
      firstName: t.exposeString("firstName", {
        description: "User's first name",
        nullable: false,
      }),
      lastName: t.exposeString("lastName", {
        description: "User's last name",
        nullable: false,
      }),
      email: t.exposeString("email", {
        description: "User's email address",
        nullable: true,
      }),
      hasAvatar: t.exposeBoolean("hasAvatar", {
        description: "Whether the user has an avatar image",
        nullable: false,
      }),
    }),
  },
);

/**
 * Reporter information with participant details
 */
export const SubmissionReportReporterInfoType = builder.objectType(
  "SubmissionReportReporterInfo",
  {
    description: "Reporter information with participant and user details",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Participant ID",
        nullable: false,
      }),
      user: t.field({
        type: SubmissionReportUserInfoType,
        description: "User details of the reporter",
        nullable: false,
        resolve: (reporter: ReporterOutput) => reporter.user,
      }),
    }),
  },
);

// =============================================================================
// Main SubmissionReport Type
// =============================================================================

/**
 * SubmissionReport type for GraphQL schema
 *
 * Derived from ReportOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
export const SubmissionReportType = builder.objectType("SubmissionReport", {
  description: "A report filed against a challenge submission",
  authScopes: { public: true },
  fields: (t) => ({
    // -------------------------------------------------------------------------
    // Identity Fields
    // -------------------------------------------------------------------------

    id: t.exposeID("id", {
      description: "Unique identifier for the report",
      nullable: false,
    }),

    submissionId: t.exposeID("submissionId", {
      description: "ID of the submission being reported",
      nullable: false,
    }),

    reporterId: t.exposeID("reporterId", {
      description: "ID of the user who filed the report",
      nullable: false,
    }),

    // -------------------------------------------------------------------------
    // Content Fields
    // -------------------------------------------------------------------------

    reason: t.field({
      type: ReportReasonEnum,
      description: "Reason for the report",
      nullable: false,
      resolve: (report: ReportOutput) =>
        report.reason as
          | "INAPPROPRIATE"
          | "CHEATING"
          | "SPAM"
          | "WRONG_SUBMISSION"
          | "OTHER",
    }),

    reasonDisplay: t.exposeString("reasonDisplay", {
      description: "Human-readable display text for the reason",
      nullable: false,
    }),

    details: t.exposeString("details", {
      description: "Additional details provided by the reporter",
      nullable: true,
    }),

    // -------------------------------------------------------------------------
    // Timestamp Fields
    // -------------------------------------------------------------------------

    createdAt: t.field({
      type: "DateTime",
      description: "When the report was created",
      nullable: false,
      resolve: (report: ReportOutput) => report.createdAt,
    }),

    // -------------------------------------------------------------------------
    // Related Objects
    // -------------------------------------------------------------------------

    reporter: t.field({
      type: SubmissionReportReporterInfoType,
      description: "Reporter information with user details",
      nullable: false,
      resolve: (report: ReportOutput) => report.reporter,
    }),

    // -------------------------------------------------------------------------
    // Computed Fields
    // -------------------------------------------------------------------------

    hasDetails: t.boolean({
      description: "Whether the report has additional details",
      nullable: false,
      resolve: (report: ReportOutput) => report.details !== null,
    }),
  }),
});

// =============================================================================
// Create Report Result Type
// =============================================================================

/**
 * Result type for create report mutation
 *
 * Derived from CreateReportOutput DTO.
 */
export const SubmissionReportCreateResultType = builder.objectType(
  "SubmissionReportCreateResult",
  {
    description: "Result of creating a submission report",
    authScopes: { public: true },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Unique identifier for the report",
        nullable: false,
      }),

      submissionId: t.exposeID("submissionId", {
        description: "ID of the submission being reported",
        nullable: false,
      }),

      reporterId: t.exposeID("reporterId", {
        description: "ID of the user who filed the report",
        nullable: false,
      }),

      reason: t.field({
        type: ReportReasonEnum,
        description: "Reason for the report",
        nullable: false,
        resolve: (report: CreateReportOutput) =>
          report.reason as
            | "INAPPROPRIATE"
            | "CHEATING"
            | "SPAM"
            | "WRONG_SUBMISSION"
            | "OTHER",
      }),

      reasonDisplay: t.exposeString("reasonDisplay", {
        description: "Human-readable display text for the reason",
        nullable: false,
      }),

      details: t.exposeString("details", {
        description: "Additional details provided by the reporter",
        nullable: true,
      }),

      createdAt: t.field({
        type: "DateTime",
        description: "When the report was created",
        nullable: false,
        resolve: (report: CreateReportOutput) => report.createdAt,
      }),

      // Null reporter for create result (loaded separately)
      reporter: t.field({
        type: SubmissionReportReporterInfoType,
        description: "Reporter information (null on create)",
        nullable: true,
        resolve: () => null,
      }),

      hasDetails: t.boolean({
        description: "Whether the report has additional details",
        nullable: false,
        resolve: (report: CreateReportOutput) => report.details !== null,
      }),
    }),
  },
);

// =============================================================================
// List Result Type
// =============================================================================

/**
 * Result type for paginated report listings
 */
export const SubmissionReportListResultType = builder.objectType(
  "SubmissionReportListResult",
  {
    description: "Paginated list of submission reports",
    authScopes: { public: true },
    fields: (t) => ({
      reports: t.field({
        type: [SubmissionReportType],
        description: "List of reports",
        nullable: false,
        resolve: (result: GetReportsOutput) => result.reports,
      }),

      totalCount: t.exposeInt("totalCount", {
        description: "Total number of reports (for pagination)",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for creating a report
 */
export const CreateReportInput = builder.inputType("CreateReportInput", {
  description: "Input for creating a new submission report",
  fields: (t) => ({
    submissionId: t.id({
      description: "ID of the submission to report",
      required: true,
    }),
    reason: t.field({
      type: ReportReasonEnum,
      description: "Reason for reporting",
      required: true,
    }),
    details: t.string({
      description: "Additional details (max 2000 characters)",
      required: false,
    }),
  }),
});

/**
 * Input for getting reports by submission
 */
export const GetReportsBySubmissionInput = builder.inputType(
  "GetReportsBySubmissionInput",
  {
    description: "Input for fetching reports for a specific submission",
    fields: (t) => ({
      submissionId: t.id({
        description: "ID of the submission to get reports for",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export default SubmissionReportType;
