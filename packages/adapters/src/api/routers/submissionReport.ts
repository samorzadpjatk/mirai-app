/**
 * Submission Report Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/submissionReport.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { submissionReportController } from "../controllers";

export const submissionReportRouter = createTRPCRouter({
  ...submissionReportController,
});
