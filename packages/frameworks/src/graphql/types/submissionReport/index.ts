/**
 * SubmissionReport GraphQL Module
 *
 * This module provides GraphQL types and resolvers for submission reports.
 * All operations are exposed through side-effect imports.
 *
 * @module SubmissionReport
 */

// Export public API
export {
  SubmissionReportType,
  SubmissionReportEdgeType,
  SubmissionReportConnectionType,
} from "./types.js";

// Side-effect: Register types and resolvers with Pothos builder
import "./types.js";
import "./queries.js";
import "./mutations.js";
