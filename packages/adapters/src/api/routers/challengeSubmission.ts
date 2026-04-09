/**
 * Challenge Submission Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers:
 * - Domain: packages/domain/src/entities/ChallengeSubmission.ts
 * - Use Cases: packages/use-cases/src/interactors/
 * - Adapters: packages/adapters/src/controllers/challengeSubmission-controller.ts
 *
 * @file packages/trpc/src/api/routers/challengeSubmission.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { challengeSubmissionController } from "../controllers";

export const challengeSubmissionRouter = createTRPCRouter({
  ...challengeSubmissionController,
});
