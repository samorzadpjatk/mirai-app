import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, requireModerator } from "../../context.js";
import { ChallengeSubmissionType, SubmissionConnectionType } from "./index.js";
import { buildConnection, clampFirst, decodeCursorWithTimestamp } from "../../utils/connections.js";

builder.queryFields((t) => ({
  mySubmissions: t.field({
    type: SubmissionConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      const first = clampFirst(args.first);
      // Placeholder implementation - returns empty connection
      return buildConnection({
        items: [],
        hasMore: false,
        getCursor: () => "",
        totalCount: 0,
      });
    },
  }),
  groupSubmissions: t.field({
    type: SubmissionConnectionType,
    args: {
      challengeId: t.arg.string({ required: true }),
      tripId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      // Placeholder implementation - returns empty connection
      return buildConnection({
        items: [],
        hasMore: false,
        getCursor: () => "",
        totalCount: 0,
      });
    },
  }),
  pendingSubmissions: t.field({
    type: SubmissionConnectionType,
    args: {
      tripId: t.arg.string({ required: true }),
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireModerator(context);
      // Placeholder implementation - returns empty connection
      return buildConnection({
        items: [],
        hasMore: false,
        getCursor: () => "",
        totalCount: 0,
      });
    },
  }),
}));
