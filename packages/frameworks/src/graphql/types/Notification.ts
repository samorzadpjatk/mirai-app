import { builder } from "../builder";

/**
 * Notification Type (Pothos)
 *
 * GraphQL type definition for Notification entity.
 */
export const NotificationType = builder.objectType<"Notification">(
  "Notification",
  {
    description: "A notification to be sent to users",
    fields: (t) => ({
      id: t.exposeID("id", { description: "Unique notification identifier" }),

      tripId: t.exposeID("tripId", {
        description: "ID of the trip this notification belongs to",
        nullable: true,
      }),

      title: t.exposeString("title", { description: "Notification title" }),

      body: t.exposeString("body", {
        description: "Notification body/message",
      }),

      url: t.exposeString("url", {
        description: "URL to open when notification is clicked",
        nullable: true,
      }),

      priority: t.exposeString("priority", {
        description: "Notification priority (LOW, NORMAL, HIGH, URGENT)",
      }),

      createdAt: t.field({
        type: "DateTime",
        description: "When the notification was created",
        resolve: (notification) => notification.createdAt,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the notification was last updated",
        resolve: (notification) => notification.updatedAt,
      }),

      createdById: t.exposeID("createdById", {
        description: "ID of the admin who created this notification",
        authScopes: { admin: true },
      }),
    }),
  },
);

/**
 * Notification Input Types
 */
export const CreateNotificationInput = builder.inputType(
  "CreateNotificationInput",
  {
    description: "Input for creating a new notification",
    fields: (t) => ({
      tripId: t.string({ required: false }),
      title: t.string({
        required: true,
        validate: { minLength: 1, maxLength: 255 },
      }),
      body: t.string({
        required: true,
        validate: { minLength: 1, maxLength: 2000 },
      }),
      url: t.string({ required: false }),
      priority: t.string({ required: false, defaultValue: "NORMAL" }),
    }),
  },
);

export const UpdateNotificationInput = builder.inputType(
  "UpdateNotificationInput",
  {
    description: "Input for updating a notification",
    fields: (t) => ({
      title: t.string({
        required: false,
        validate: { minLength: 1, maxLength: 255 },
      }),
      body: t.string({
        required: false,
        validate: { minLength: 1, maxLength: 2000 },
      }),
      url: t.string({ required: false }),
      priority: t.string({ required: false }),
    }),
  },
);
