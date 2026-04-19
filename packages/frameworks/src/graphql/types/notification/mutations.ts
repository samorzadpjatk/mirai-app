// =============================================================================
// Notification Mutations - Effect DI Pattern
// =============================================================================

import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth, runEffect } from "../../context.js";
import { mapErrorToGraphQL } from "../../errors.js";
import { NotificationId } from "@mirai-app/domain";
import { UpdatePreferencesInput, NotificationType } from "./index.js";

// Import use cases
import {
  DeleteNotificationUseCase,
  MarkAllNotificationsReadUseCase,
  UpdateNotificationPreferencesUseCase,
} from "@mirai-app/use-cases/notification";

builder.mutationFields((t) => ({
  // Using DeleteNotification as "mark as read" - removes from user's view
  markNotificationRead: t.field({
    type: "Boolean",
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);

      const useCase = new DeleteNotificationUseCase();
      const effect = useCase.execute({
        notificationId: NotificationId.unsafeCreate(args.id),
      });

      return runEffect(context, effect)
        .then(() => true)
        .catch((error) => {
          throw mapErrorToGraphQL(error);
        });
    },
  }),
  markAllNotificationsRead: t.field({
    type: builder.objectType("MarkAllReadResult", { fields: (t2) => ({ count: t2.exposeInt("count") }) }),
    resolve: async (_parent, _args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new MarkAllNotificationsReadUseCase();
      const effect = useCase.execute({
        userId: auth.userId,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
  updateNotificationPreferences: t.field({
    type: builder.objectType("UpdatePreferencesResult", { fields: (t2) => ({
      pushEnabled: t2.exposeBoolean("pushEnabled"),
      emailEnabled: t2.exposeBoolean("emailEnabled"),
      challengeEnabled: t2.exposeBoolean("challengeEnabled"),
      rankingEnabled: t2.exposeBoolean("rankingEnabled"),
      systemEnabled: t2.exposeBoolean("systemEnabled"),
    }) }),
    args: { input: t.arg({ type: UpdatePreferencesInput, required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      const auth = requireAuth(context);

      const useCase = new UpdateNotificationPreferencesUseCase();
      const effect = useCase.execute({
        userId: auth.userId,
        pushEnabled: args.input.pushEnabled ?? undefined,
        emailEnabled: args.input.emailEnabled ?? undefined,
        challengeEnabled: args.input.challengeEnabled ?? undefined,
        rankingEnabled: args.input.rankingEnabled ?? undefined,
        systemEnabled: args.input.systemEnabled ?? undefined,
      });

      return runEffect(context, effect).catch((error) => {
        throw mapErrorToGraphQL(error);
      });
    },
  }),
}));

export const notificationMutations = {};