import { builder, NotificationTypeEnum, NotificationPriorityEnum } from "../../builder.js";

export const NotificationType = builder.objectType("Notification", {
  description: "Notification entity",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId", { nullable: true }),
    title: t.exposeString("title"),
    body: t.exposeString("body"),
    url: t.exposeString("url", { nullable: true }),
    createdById: t.exposeID("createdById"),
    createdAt: t.field({ type: "DateTime", resolve: (n) => n.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: (n) => n.updatedAt }),
  }),
});

export const NotificationConnectionType = builder.connectionObject(
  { name: "NotificationConnection", type: NotificationType },
  { name: "NotificationEdge" }
);

export const NotificationPreferencesType = builder.objectType("NotificationPreferences", {
  fields: (t) => ({
    userId: t.exposeID("userId"),
    pushEnabled: t.exposeBoolean("pushEnabled"),
    emailEnabled: t.exposeBoolean("emailEnabled"),
    challengeEnabled: t.exposeBoolean("challengeEnabled"),
    rankingEnabled: t.exposeBoolean("rankingEnabled"),
    systemEnabled: t.exposeBoolean("systemEnabled"),
  }),
});

export const UpdatePreferencesInput = builder.inputType("UpdateNotificationPreferencesInput", {
  fields: (t) => ({
    pushEnabled: t.boolean({ required: false }),
    emailEnabled: t.boolean({ required: false }),
    challengeEnabled: t.boolean({ required: false }),
    rankingEnabled: t.boolean({ required: false }),
    systemEnabled: t.boolean({ required: false }),
  }),
});

import "./queries.js";
import "./mutations.js";
