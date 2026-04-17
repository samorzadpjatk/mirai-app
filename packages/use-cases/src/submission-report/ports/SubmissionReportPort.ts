import { Context } from "effect";
import type {
  ISubmissionReportPort,
  SubmissionReport,
  SubmissionReportWithReporter,
} from "@mirai-app/domain";

/**
 * SubmissionReport Port - Context.Tag for Effect DI
 */
export class SubmissionReportPortTag extends Context.Tag(
  "SubmissionReportPort",
)<SubmissionReportPortTag, ISubmissionReportPort>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ISubmissionReportPort, SubmissionReport, SubmissionReportWithReporter };

/**
 * @deprecated Use SubmissionReportPortTag instead. Kept for backward compatibility.
 */
export const SubmissionReportPort = SubmissionReportPortTag;

/**
 * @deprecated Use ISubmissionReportPort instead. Kept for backward compatibility.
 */
export type SubmissionReportPort = typeof SubmissionReportPortTag;
