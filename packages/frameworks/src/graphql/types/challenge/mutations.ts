import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAdmin } from "../../context.js";
import { ChallengeId, TripId } from "@mirai-app/domain";
import { CreateChallengeInput, UpdateChallengeInput, DeleteChallengeInput, ChallengeResultType, ForceCloseVotingResultType } from "./types.js";

builder.mutationFields((t) => ({
  createChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: CreateChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        id: ChallengeId.unsafeCreate("placeholder"),
        tripId: TripId.unsafeCreate(args.input.tripId),
        name: args.input.name,
        status: "HIDDEN" as const,
        isRecurring: args.input.isRecurring ?? false,
      };
    },
  }),
  updateChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: UpdateChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        id: ChallengeId.unsafeCreate(args.input.id),
        tripId: TripId.unsafeCreate(args.input.tripId),
        name: "Updated",
        status: "ACTIVE" as const,
        isRecurring: false,
      };
    },
  }),
  deleteChallenge: t.field({
    type: ChallengeResultType,
    args: { input: t.arg({ type: DeleteChallengeInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        id: ChallengeId.unsafeCreate(args.input.id),
        tripId: TripId.unsafeCreate(args.input.tripId),
        name: "Deleted",
        status: "CANCELLED" as const,
        isRecurring: false,
      };
    },
  }),
  forceCloseVoting: t.field({
    type: ForceCloseVotingResultType,
    args: { id: t.arg.string({ required: true }), tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAdmin(context);
      return {
        id: ChallengeId.unsafeCreate(args.id),
        name: "Challenge",
        status: "COMPLETED" as const,
      };
    },
  }),
}));

export const challengeMutations = {};