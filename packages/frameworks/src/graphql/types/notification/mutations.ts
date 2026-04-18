import { builder } from "../../builder.js";
import type { GraphQLContext } from "../../context.js";
import { requireAuth } from "../../context.js";
import { NotificationId, TripId, UserId } from "@mirai-app/domain";
import { UpdatePreferencesInput, NotificationType } from "./index.js";

builder.mutationFields((t) => ({
  markNotificationRead: t.field({
    type: NotificationType,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_parent, args, context: GraphQLContext) => {
      requireAuth(context);
      return {
        id: NotificationId.unsafeCreate(args.id),
        tripId: null,
        title: "",
        body: "",
        url: null,
        createdById: UserId.unsafeCreate("placeholder"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
  }),
  markAllNotificationsRead: t.field({
    type: builder.objectType("MarkAllReadResult", { fields: (t2) => ({ count: t2.exposeInt("count") }) }),
    resolve: async (_parent, _args, context: GraphQLContext) => {
      requireAuth(context);
      return { count: 0 };
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
      requireAuth(context);
      return {
        pushEnabled: args.input.pushEnabled ?? true,
        emailEnabled: args.input.emailEnabled ?? true,
        challengeEnabled: args.input.challengeEnabled ?? true,
        rankingEnabled: args.input.rankingEnabled ?? true,
        systemEnabled: args.input.systemEnabled ?? true,
      };
    },
  }),
}));

export const notificationMutations = {};