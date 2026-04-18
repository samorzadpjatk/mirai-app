import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { clampFirst } from "../../utils/connections.js";
import { ActivityFeedConnectionType } from "./index.js";

builder.queryFields((t) => ({
  activityFeed: t.field({
    type: ActivityFeedConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      const first = clampFirst(args.first);
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    },
  }),
  groupActivity: t.field({
    type: ActivityFeedConnectionType,
    args: {
      groupId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      const first = clampFirst(args.first);
      return {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };
    },
  }),
}));

export const activityFeedQueries = {};