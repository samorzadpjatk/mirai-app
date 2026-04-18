import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireAdmin } from "../../context.js";
import {
  RewardType,
  RewardConnectionType,
  RedeemedRewardType,
} from "./index.js";
import { clampFirst, decodeCursorWithTimestamp } from "../../utils/connections.js";

builder.queryFields((t) => ({
  rewards: t.field({
    type: RewardConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      const first = clampFirst(args.first);
      const after = args.after
        ? decodeCursorWithTimestamp(args.after)
        : undefined;
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
  myRedeemedRewards: t.field({
    type: [RedeemedRewardType],
    args: { tripId: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return [];
    },
  }),
  allRewards: t.field({
    type: [RewardType],
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAdmin(context);
      return [];
    },
  }),
}));
