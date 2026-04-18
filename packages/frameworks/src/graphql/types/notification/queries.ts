import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { NotificationConnectionType, NotificationPreferencesType } from "./index.js";

builder.queryFields((t) => ({
  myNotifications: t.field({
    type: NotificationConnectionType,
    args: {
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
  notificationPreferences: t.field({
    type: NotificationPreferencesType,
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAuth(context);
      return { userId: "placeholder", pushEnabled: true, emailEnabled: true, challengeEnabled: true, rankingEnabled: true, systemEnabled: true };
    },
  }),
}));

export const notificationQueries = {};