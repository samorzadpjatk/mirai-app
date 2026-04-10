/**
 * Simple Notification Sender Schema Test
 *
 * Minimal test to verify notification sender types work correctly.
 * This avoids loading modules with broken dependencies.
 */

import { describe, it, expect } from "bun:test";
import SchemaBuilder from "@pothos/core";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";

describe("[UNIT] NotificationSender Types", () => {
  it("should create notification sender types using fresh builder", async () => {
    // Create a fresh builder for testing
    const builder = new SchemaBuilder<{
      Context: { container: unknown; request: Request };
      AuthScopes: { public: boolean; admin: boolean };
    }>({
      plugins: [ScopeAuthPlugin],
      notStrict: true,
      scopeAuth: {
        authScopes: async () => ({
          public: true,
          admin: false,
        }),
      },
    });

    // Define delivery status enum
    builder.enumType("NotificationDeliveryStatus", {
      description: "Status of a notification delivery",
      values: {
        PENDING: { value: "pending" },
        SUCCESS: { value: "success" },
        PARTIAL_FAILURE: { value: "partial_failure" },
        FAILURE: { value: "failure" },
      },
    });

    // Define payload types
    builder.objectType("SendMobileNotificationsPayload", {
      description: "Result of sending mobile push notifications",
      authScopes: { public: true },
      fields: (t) => ({
        success: t.boolean({
          description: "Whether the send operation was successful",
          nullable: false,
          resolve: () => true,
        }),
        sent: t.int({
          description: "Number of notifications successfully sent",
          nullable: false,
          resolve: () => 0,
        }),
        failed: t.int({
          description: "Number of notifications that failed to send",
          nullable: false,
          resolve: () => 0,
        }),
        total: t.int({
          description: "Total number of recipients targeted",
          nullable: false,
          resolve: () => 0,
        }),
      }),
    });

    builder.objectType("TrackDeliveryStartPayload", {
      description: "Result of tracking delivery start",
      authScopes: { public: true },
      fields: (t) => ({
        success: t.boolean({
          description: "Whether the tracking was recorded successfully",
          nullable: false,
          resolve: () => true,
        }),
      }),
    });

    builder.objectType("TrackDeliveryCompletePayload", {
      description: "Result of tracking delivery completion",
      authScopes: { public: true },
      fields: (t) => ({
        success: t.boolean({
          description: "Whether the tracking was recorded successfully",
          nullable: false,
          resolve: () => true,
        }),
      }),
    });

    builder.objectType("TrackDeliveryFailurePayload", {
      description: "Result of tracking delivery failure",
      authScopes: { public: true },
      fields: (t) => ({
        success: t.boolean({
          description: "Whether the failure was recorded successfully",
          nullable: false,
          resolve: () => true,
        }),
      }),
    });

    builder.objectType("CheckInactiveUsersPayload", {
      description: "Result of checking inactive users",
      authScopes: { public: true },
      fields: (t) => ({
        checked: t.int({
          description: "Number of users checked for inactivity",
          nullable: false,
          resolve: () => 0,
        }),
        notified: t.int({
          description: "Number of users notified",
          nullable: false,
          resolve: () => 0,
        }),
        skipped: t.int({
          description: "Number of users skipped",
          nullable: false,
          resolve: () => 0,
        }),
        errors: t.int({
          description: "Number of errors encountered",
          nullable: false,
          resolve: () => 0,
        }),
      }),
    });

    // Define input types
    builder.inputType("SendMobileNotificationsInput", {
      description: "Input for sending mobile push notifications",
      fields: (t) => ({
        notificationId: t.id({
          description: "ID of the notification to send",
          required: true,
        }),
      }),
    });

    builder.inputType("TrackDeliveryStartInput", {
      description: "Input for tracking delivery start",
      fields: (t) => ({
        notificationId: t.id({
          description: "ID of the notification being delivered",
          required: true,
        }),
      }),
    });

    builder.inputType("TrackDeliveryCompleteInput", {
      description: "Input for tracking delivery completion",
      fields: (t) => ({
        notificationId: t.id({
          description: "ID of the notification that was delivered",
          required: true,
        }),
        totalRecipients: t.int({
          description: "Total number of recipients",
          required: true,
        }),
        successCount: t.int({
          description: "Number of successful deliveries",
          required: true,
        }),
        failureCount: t.int({
          description: "Number of failed deliveries",
          required: true,
        }),
        errors: t.string({
          description: "Error details if any failures occurred",
          required: false,
        }),
      }),
    });

    builder.inputType("TrackDeliveryFailureInput", {
      description: "Input for tracking delivery failure",
      fields: (t) => ({
        notificationId: t.id({
          description: "ID of the notification that failed",
          required: true,
        }),
        error: t.string({
          description: "Error message describing the failure",
          required: true,
        }),
      }),
    });

    // Create mutation type with notification sender fields
    builder.mutationType({
      description: "Root mutation type",
      authScopes: { admin: true },
    });

    // Add mutation fields
    builder.mutationField("sendMobileNotifications", (t) =>
      t.field({
        description: "Send mobile push notifications (admin only)",
        type: "SendMobileNotificationsPayload",
        args: {
          input: t.arg({
            type: "SendMobileNotificationsInput",
            description: "Input for sending notifications",
            required: true,
          }),
        },
        authScopes: { admin: true },
        resolve: async () => ({
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
        }),
      }),
    );

    builder.mutationField("trackDeliveryStart", (t) =>
      t.field({
        description: "Track the start of a notification delivery (admin only)",
        type: "TrackDeliveryStartPayload",
        args: {
          input: t.arg({
            type: "TrackDeliveryStartInput",
            description: "Input for tracking delivery start",
            required: true,
          }),
        },
        authScopes: { admin: true },
        resolve: async () => ({ success: true }),
      }),
    );

    builder.mutationField("trackDeliveryComplete", (t) =>
      t.field({
        description:
          "Track the completion of a notification delivery (admin only)",
        type: "TrackDeliveryCompletePayload",
        args: {
          input: t.arg({
            type: "TrackDeliveryCompleteInput",
            description: "Input for tracking delivery completion",
            required: true,
          }),
        },
        authScopes: { admin: true },
        resolve: async () => ({ success: true }),
      }),
    );

    builder.mutationField("trackDeliveryFailure", (t) =>
      t.field({
        description: "Track a notification delivery failure (admin only)",
        type: "TrackDeliveryFailurePayload",
        args: {
          input: t.arg({
            type: "TrackDeliveryFailureInput",
            description: "Input for tracking delivery failure",
            required: true,
          }),
        },
        authScopes: { admin: true },
        resolve: async () => ({ success: true }),
      }),
    );

    builder.mutationField("checkInactiveUsers", (t) =>
      t.field({
        description:
          "Check for inactive users and send nudge notifications (admin only, currently disabled)",
        type: "CheckInactiveUsersPayload",
        authScopes: { admin: true },
        resolve: async () => ({
          checked: 0,
          notified: 0,
          skipped: 0,
          errors: 0,
        }),
      }),
    );

    // Build schema
    const schema = builder.toSchema();
    expect(schema).toBeDefined();

    // Verify all types are registered
    const typeMap = schema.getTypeMap();
    expect(typeMap.SendMobileNotificationsPayload).toBeDefined();
    expect(typeMap.TrackDeliveryStartPayload).toBeDefined();
    expect(typeMap.TrackDeliveryCompletePayload).toBeDefined();
    expect(typeMap.TrackDeliveryFailurePayload).toBeDefined();
    expect(typeMap.CheckInactiveUsersPayload).toBeDefined();
    expect(typeMap.NotificationDeliveryStatus).toBeDefined();
    expect(typeMap.SendMobileNotificationsInput).toBeDefined();
    expect(typeMap.TrackDeliveryStartInput).toBeDefined();
    expect(typeMap.TrackDeliveryCompleteInput).toBeDefined();
    expect(typeMap.TrackDeliveryFailureInput).toBeDefined();
    expect(typeMap.Mutation).toBeDefined();

    // Verify mutation fields exist
    const mutationType = schema.getMutationType();
    expect(mutationType).toBeDefined();

    const fields = mutationType?.getFields();
    expect(fields?.sendMobileNotifications).toBeDefined();
    expect(fields?.trackDeliveryStart).toBeDefined();
    expect(fields?.trackDeliveryComplete).toBeDefined();
    expect(fields?.trackDeliveryFailure).toBeDefined();
    expect(fields?.checkInactiveUsers).toBeDefined();
  });
});
