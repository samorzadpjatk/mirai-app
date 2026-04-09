/**
 * ChallengeVote Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/challengeVote.ts
 * @total_lines ~50
 */

import { createTRPCRouter } from "../trpc";
import { challengeVoteController } from "../controllers";

export const challengeVoteRouter = createTRPCRouter({
  ...challengeVoteController,
});
