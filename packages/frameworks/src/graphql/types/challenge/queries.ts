import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin } from "../../context.js";
import { ChallengeType, ChallengeConnectionType } from "./types.js";

builder.queryFields((t) => ({
  challenges: t.field({
    type: ChallengeConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      };
    },
  }),
  challenge: t.field({
    type: ChallengeType,
    nullable: true,
    args: { id: t.arg.string({ required: true }), tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return null;
    },
  }),
  allChallenges: t.field({
    type: [ChallengeType],
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAdmin(context);
      return [];
    },
  }),
}));

export const challengeQueries = {};
