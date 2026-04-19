// =============================================================================
// Notification Queries - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { NotificationConnectionType, NotificationPreferencesType } from "./index.js";

// Import use cases
import {
  GetAllMyNotificationsUseCase,
  GetNotificationPreferencesUseCase,
} from "@mirai-app/use-cases/notification";

builder.queryFields((t) => ({
  myNotifications: t.field({
    type: NotificationConnectionType,
    args: {
      first: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      // Convert Relay cursor pagination to page-based
      const first = args.first ?? 20;
      const after = args.after ? parseInt(args.after, 10) : 0;
      const page = Math.floor(after / first) + 1;

      const useCase = new GetAllMyNotificationsUseCase();
      const effect = useCase.execute({
        userId: auth.userId,
        page,
        pageSize: first,
      });

      return runEffect(context, effect)
        .then((result) => ({
          edges: result.notifications.map((n, index) => ({
            cursor: String(after + index + 1),
            node: n,
          })),
          pageInfo: {
            hasNextPage: result.pagination.page < result.pagination.totalPages,
            hasPreviousPage: page > 1,
            startCursor: result.notifications.length > 0 ? String(after + 1) : null,
            endCursor: result.notifications.length > 0 ? String(after + result.notifications.length) : null,
          },
        }))
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
  notificationPreferences: t.field({
    type: NotificationPreferencesType,
    resolve: async (_parent, _args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new GetNotificationPreferencesUseCase();
      const effect = useCase.execute({
        userId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const notificationQueries = {};