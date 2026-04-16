import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Notification } from "./notification";
import {
  NotificationStatus,
  NotificationPriority,
} from "../../notification/enums";
import { ValidationError, StateTransitionError } from "../../system/errors";

describe("[UNIT] Notification Entity", () => {
  // ============================================================================
  // Factory Method Tests
  // ============================================================================
  describe("create", () => {
    it("creates notification with default values", async () => {
      const effect = Notification.create({
        title: "Test Notification",
        body: "This is a test notification",
        createdById: "user-123",
      });

      const notification = await Effect.runPromise(effect);

      expect(notification.title).toBe("Test Notification");
      expect(notification.body).toBe("This is a test notification");
      expect(notification.status).toBe(NotificationStatus.DRAFT);
      expect(notification.priority).toBe(NotificationPriority.NORMAL);
      expect(notification.tripId).toBeNull();
      expect(notification.url).toBeNull();
      expect(notification.scheduledFor).toBeNull();
      expect(notification.sentAt).toBeNull();
      expect(notification.failureReason).toBeNull();
      expect(notification.createdById).toBe("user-123");
      expect(notification.id).toBeDefined();
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
    });

    it("creates notification with all properties provided", async () => {
      const scheduledDate = new Date("2024-12-01T10:00:00Z");
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");

      const effect = Notification.create({
        id: "notif-123",
        tripId: "trip-456",
        title: "Trip Reminder",
        body: "Your trip is tomorrow",
        url: "https://example.com/trip/456",
        status: NotificationStatus.READY,
        priority: NotificationPriority.HIGH,
        scheduledFor: scheduledDate,
        sentAt: null,
        failureReason: null,
        createdAt,
        updatedAt,
        createdById: "user-789",
      });

      const notification = await Effect.runPromise(effect);

      expect(notification.id).toBe("notif-123");
      expect(notification.tripId).toBe("trip-456");
      expect(notification.title).toBe("Trip Reminder");
      expect(notification.body).toBe("Your trip is tomorrow");
      expect(notification.url).toBe("https://example.com/trip/456");
      expect(notification.status).toBe(NotificationStatus.READY);
      expect(notification.priority).toBe(NotificationPriority.HIGH);
      expect(notification.scheduledFor).toBe(scheduledDate);
      expect(notification.createdById).toBe("user-789");
      expect(notification.createdAt).toBe(createdAt);
      expect(notification.updatedAt).toBe(updatedAt);
    });

    it("fails when title is empty", async () => {
      const effect = Notification.create({
        title: "",
        body: "Valid body content",
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails when title exceeds max length", async () => {
      const longTitle = "a".repeat(256);

      const effect = Notification.create({
        title: longTitle,
        body: "Valid body content",
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails when body is empty", async () => {
      const effect = Notification.create({
        title: "Valid Title",
        body: "",
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("body");
      }
    });

    it("fails when body exceeds max length", async () => {
      const longBody = "a".repeat(2001);

      const effect = Notification.create({
        title: "Valid Title",
        body: longBody,
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("body");
      }
    });

    it("fails when URL exceeds max length", async () => {
      const longUrl = "https://example.com/" + "a".repeat(500);

      const effect = Notification.create({
        title: "Valid Title",
        body: "Valid body content",
        url: longUrl,
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("url");
      }
    });

    it("fails when createdById is empty", async () => {
      const effect = Notification.create({
        title: "Valid Title",
        body: "Valid body content",
        createdById: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("createdById");
      }
    });

    it("treats empty tripId as null", async () => {
      const effect = Notification.create({
        title: "Valid Title",
        body: "Valid body content",
        tripId: "",
        createdById: "user-123",
      });

      const notification = await Effect.runPromise(effect);

      expect(notification.tripId).toBeNull();
    });

    it("fails with invalid status value", async () => {
      const effect = Notification.create({
        title: "Valid Title",
        body: "Valid body content",
        status: "INVALID_STATUS" as NotificationStatus,
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("status");
        expect(result.left.message).toContain("Invalid status");
      }
    });

    it("fails with invalid priority value", async () => {
      const effect = Notification.create({
        title: "Valid Title",
        body: "Valid body content",
        priority: "INVALID_PRIORITY" as NotificationPriority,
        createdById: "user-123",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("priority");
        expect(result.left.message).toContain("Invalid priority");
      }
    });
  });

  // ============================================================================
  // State Machine Tests
  // ============================================================================
  describe("state transitions", () => {
    describe("DRAFT status", () => {
      it("can transition from DRAFT to READY via markReady", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        const ready = await Effect.runPromise(draft.markReady());

        expect(ready.status).toBe(NotificationStatus.READY);
        expect(ready.isReady()).toBe(true);
        expect(ready.isDraft()).toBe(false);
      });

      it("can transition from DRAFT to CANCELLED via cancel", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        const cancelled = await Effect.runPromise(draft.cancel());

        expect(cancelled.status).toBe(NotificationStatus.CANCELLED);
        expect(cancelled.isCancelled()).toBe(true);
      });

      it("cannot transition from DRAFT to SENT", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        const result = await Effect.runPromise(Effect.either(draft.markSent()));

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
          expect(result.left.from).toBe(NotificationStatus.DRAFT);
          expect(result.left.to).toBe(NotificationStatus.SENT);
        }
      });

      it("cannot transition from DRAFT to FAILED", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        const result = await Effect.runPromise(
          Effect.either(draft.markFailed("error")),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });
    });

    describe("READY status", () => {
      async function createReadyNotification(): Promise<Notification> {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );
        return Effect.runPromise(draft.markReady());
      }

      it("can transition from READY to SENT via markSent", async () => {
        const ready = await createReadyNotification();

        const sent = await Effect.runPromise(ready.markSent());

        expect(sent.status).toBe(NotificationStatus.SENT);
        expect(sent.isSent()).toBe(true);
        expect(sent.sentAt).toBeInstanceOf(Date);
        expect(sent.sentAt!.getTime()).toBeLessThanOrEqual(Date.now());
      });

      it("can transition from READY to FAILED via markFailed", async () => {
        const ready = await createReadyNotification();

        const failed = await Effect.runPromise(
          ready.markFailed("Network timeout"),
        );

        expect(failed.status).toBe(NotificationStatus.FAILED);
        expect(failed.isFailed()).toBe(true);
        expect(failed.failureReason).toBe("Network timeout");
      });

      it("can transition from READY to CANCELLED via cancel", async () => {
        const ready = await createReadyNotification();

        const cancelled = await Effect.runPromise(ready.cancel());

        expect(cancelled.status).toBe(NotificationStatus.CANCELLED);
      });

      it("cannot transition from READY to DRAFT", async () => {
        const ready = await createReadyNotification();

        const result = await Effect.runPromise(
          Effect.either(ready.transitionStatus(NotificationStatus.DRAFT)),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });
    });

    describe("SENT status (terminal)", () => {
      async function createSentNotification(): Promise<Notification> {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );
        const ready = await Effect.runPromise(draft.markReady());
        return Effect.runPromise(ready.markSent());
      }

      it("is in terminal state", async () => {
        const sent = await createSentNotification();

        expect(sent.isTerminal()).toBe(true);
      });

      it("cannot transition from SENT to any other state", async () => {
        const sent = await createSentNotification();

        const transitions = [
          NotificationStatus.DRAFT,
          NotificationStatus.READY,
          NotificationStatus.FAILED,
          NotificationStatus.CANCELLED,
        ];

        for (const target of transitions) {
          const result = await Effect.runPromise(
            Effect.either(sent.transitionStatus(target)),
          );
          expect(result._tag).toBe("Left");
        }
      });
    });

    describe("FAILED status with retry capability", () => {
      async function createFailedNotification(): Promise<Notification> {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );
        const ready = await Effect.runPromise(draft.markReady());
        return Effect.runPromise(ready.markFailed("Initial failure"));
      }

      it("can transition from FAILED back to READY (retry)", async () => {
        const failed = await createFailedNotification();

        const retry = await Effect.runPromise(failed.markReady());

        expect(retry.status).toBe(NotificationStatus.READY);
        expect(retry.failureReason).toBe("Initial failure");
      });

      it("cannot transition from FAILED to SENT directly", async () => {
        const failed = await createFailedNotification();

        const result = await Effect.runPromise(
          Effect.either(failed.markSent()),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StateTransitionError);
        }
      });

      it("cannot transition from FAILED to CANCELLED", async () => {
        const failed = await createFailedNotification();

        const result = await Effect.runPromise(Effect.either(failed.cancel()));

        expect(result._tag).toBe("Left");
      });
    });

    describe("CANCELLED status (terminal)", () => {
      async function createCancelledNotification(): Promise<Notification> {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );
        return Effect.runPromise(draft.cancel());
      }

      it("is in terminal state", async () => {
        const cancelled = await createCancelledNotification();

        expect(cancelled.isTerminal()).toBe(true);
      });

      it("cannot transition from CANCELLED to any other state", async () => {
        const cancelled = await createCancelledNotification();

        const transitions = [
          NotificationStatus.DRAFT,
          NotificationStatus.READY,
          NotificationStatus.SENT,
          NotificationStatus.FAILED,
        ];

        for (const target of transitions) {
          const result = await Effect.runPromise(
            Effect.either(cancelled.transitionStatus(target)),
          );
          expect(result._tag).toBe("Left");
        }
      });
    });
  });

  // ============================================================================
  // Mark Failed with Validation
  // ============================================================================
  describe("markFailed", () => {
    it("fails when reason is empty", async () => {
      const ready = await Effect.runPromise(
        Notification.create({
          title: "Test",
          body: "Body",
          status: NotificationStatus.READY,
          createdById: "user-123",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(ready.markFailed("")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("failureReason");
      }
    });

    it("fails when reason exceeds max length", async () => {
      const ready = await Effect.runPromise(
        Notification.create({
          title: "Test",
          body: "Body",
          status: NotificationStatus.READY,
          createdById: "user-123",
        }),
      );

      const longReason = "a".repeat(1001);
      const result = await Effect.runPromise(
        Effect.either(ready.markFailed(longReason)),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.field).toBe("failureReason");
      }
    });
  });

  // ============================================================================
  // Content Update Tests (Draft-only)
  // ============================================================================
  describe("update", () => {
    it("can update title in DRAFT status", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Original Title",
          body: "Body content",
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(
        draft.update({ title: "Updated Title" }),
      );

      expect(updated.title).toBe("Updated Title");
      expect(updated.body).toBe("Body content");
    });

    it("can update body in DRAFT status", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Original body",
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(
        draft.update({ body: "Updated body" }),
      );

      expect(updated.body).toBe("Updated body");
      expect(updated.title).toBe("Title");
    });

    it("can update URL in DRAFT status", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          url: "https://old.com",
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(
        draft.update({ url: "https://new.com" }),
      );

      expect(updated.url).toBe("https://new.com");
    });

    it("can clear URL by setting to null", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          url: "https://example.com",
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(draft.update({ url: null }));

      expect(updated.url).toBeNull();
    });

    it("can update priority in DRAFT status", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          priority: NotificationPriority.NORMAL,
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(
        draft.update({ priority: NotificationPriority.HIGH }),
      );

      expect(updated.priority).toBe(NotificationPriority.HIGH);
    });

    it("can update multiple fields at once", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          url: null,
          priority: NotificationPriority.LOW,
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(
        draft.update({
          title: "New Title",
          body: "New Body",
          url: "https://example.com",
          priority: NotificationPriority.URGENT,
        }),
      );

      expect(updated.title).toBe("New Title");
      expect(updated.body).toBe("New Body");
      expect(updated.url).toBe("https://example.com");
      expect(updated.priority).toBe(NotificationPriority.URGENT);
    });

    it("fails to update when not in DRAFT status", async () => {
      const ready = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          status: NotificationStatus.READY,
          createdById: "user-123",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(ready.update({ title: "New Title" })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        const error = result.left as ValidationError;
        expect(error.message).toContain("DRAFT");
      }
    });

    it("fails with invalid title in update", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Valid Title",
          body: "Body",
          createdById: "user-123",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(draft.update({ title: "" })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("title");
      }
    });

    it("fails with invalid priority in update", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "user-123",
        }),
      );

      const result = await Effect.runPromise(
        Effect.either(
          draft.update({ priority: "INVALID" as NotificationPriority }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("priority");
      }
    });
  });

  // ============================================================================
  // Scheduling Tests
  // ============================================================================
  describe("schedule", () => {
    it("can schedule a notification", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "user-123",
        }),
      );

      const scheduledDate = new Date("2024-12-25T10:00:00Z");
      const scheduled = await Effect.runPromise(draft.schedule(scheduledDate));

      expect(scheduled.scheduledFor).toBe(scheduledDate);
      expect(scheduled.isScheduled()).toBe(true);
    });

    it("can reschedule a notification", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Title",
          body: "Body",
          scheduledFor: new Date("2024-01-01"),
          createdById: "user-123",
        }),
      );

      const newDate = new Date("2024-12-31");
      const rescheduled = await Effect.runPromise(draft.schedule(newDate));

      expect(rescheduled.scheduledFor).toBe(newDate);
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("query methods", () => {
    describe("status checks", () => {
      it("isDraft returns true only for DRAFT", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        expect(draft.isDraft()).toBe(true);

        const ready = await Effect.runPromise(draft.markReady());
        expect(ready.isDraft()).toBe(false);
      });

      it("isReady returns true only for READY", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        expect(draft.isReady()).toBe(false);

        const ready = await Effect.runPromise(draft.markReady());
        expect(ready.isReady()).toBe(true);
      });

      it("isSent returns true only for SENT", async () => {
        const ready = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            status: NotificationStatus.READY,
            createdById: "user-123",
          }),
        );

        expect(ready.isSent()).toBe(false);

        const sent = await Effect.runPromise(ready.markSent());
        expect(sent.isSent()).toBe(true);
      });

      it("isFailed returns true only for FAILED", async () => {
        const ready = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            status: NotificationStatus.READY,
            createdById: "user-123",
          }),
        );

        expect(ready.isFailed()).toBe(false);

        const failed = await Effect.runPromise(ready.markFailed("error"));
        expect(failed.isFailed()).toBe(true);
      });

      it("isCancelled returns true only for CANCELLED", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        expect(draft.isCancelled()).toBe(false);

        const cancelled = await Effect.runPromise(draft.cancel());
        expect(cancelled.isCancelled()).toBe(true);
      });

      it("isTerminal returns true for SENT and CANCELLED", async () => {
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        expect(draft.isTerminal()).toBe(false);

        const ready = await Effect.runPromise(draft.markReady());
        expect(ready.isTerminal()).toBe(false);

        const sent = await Effect.runPromise(ready.markSent());
        expect(sent.isTerminal()).toBe(true);

        const draft2 = await Effect.runPromise(
          Notification.create({
            title: "Test 2",
            body: "Body",
            createdById: "user-123",
          }),
        );
        const cancelled = await Effect.runPromise(draft2.cancel());
        expect(cancelled.isTerminal()).toBe(true);
      });
    });

    describe("priority checks", () => {
      it("isHighPriority returns true for HIGH and URGENT", async () => {
        const low = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.LOW,
            createdById: "user-123",
          }),
        );
        const normal = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.NORMAL,
            createdById: "user-123",
          }),
        );
        const high = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.HIGH,
            createdById: "user-123",
          }),
        );
        const urgent = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.URGENT,
            createdById: "user-123",
          }),
        );

        expect(low.isHighPriority()).toBe(false);
        expect(normal.isHighPriority()).toBe(false);
        expect(high.isHighPriority()).toBe(true);
        expect(urgent.isHighPriority()).toBe(true);
      });

      it("isUrgent returns true only for URGENT", async () => {
        const high = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.HIGH,
            createdById: "user-123",
          }),
        );
        const urgent = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            priority: NotificationPriority.URGENT,
            createdById: "user-123",
          }),
        );

        expect(high.isUrgent()).toBe(false);
        expect(urgent.isUrgent()).toBe(true);
      });
    });

    describe("scheduling checks", () => {
      it("isScheduled returns true when scheduledFor is set", async () => {
        const immediate = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );
        const scheduled = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            scheduledFor: new Date("2024-12-25"),
            createdById: "user-123",
          }),
        );

        expect(immediate.isScheduled()).toBe(false);
        expect(scheduled.isScheduled()).toBe(true);
      });

      it("isDue returns true when READY and scheduled time has passed", async () => {
        const pastDate = new Date("2024-01-01");
        const futureDate = new Date("2099-12-31");
        const now = new Date("2024-06-15");

        const readyPast = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            status: NotificationStatus.READY,
            scheduledFor: pastDate,
            createdById: "user-123",
          }),
        );
        const readyFuture = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            status: NotificationStatus.READY,
            scheduledFor: futureDate,
            createdById: "user-123",
          }),
        );
        const draft = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            scheduledFor: pastDate,
            createdById: "user-123",
          }),
        );
        const immediate = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            status: NotificationStatus.READY,
            createdById: "user-123",
          }),
        );

        expect(readyPast.isDue(now)).toBe(true);
        expect(readyFuture.isDue(now)).toBe(false);
        expect(draft.isDue(now)).toBe(false);
        expect(immediate.isDue(now)).toBe(false);
      });
    });

    describe("ownership checks", () => {
      it("belongsToTrip returns true for matching tripId", async () => {
        const withTrip = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            tripId: "trip-123",
            createdById: "user-123",
          }),
        );
        const withoutTrip = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-123",
          }),
        );

        expect(withTrip.belongsToTrip("trip-123")).toBe(true);
        expect(withTrip.belongsToTrip("trip-456")).toBe(false);
        expect(withoutTrip.belongsToTrip("trip-123")).toBe(false);
      });

      it("wasCreatedBy returns true for matching userId", async () => {
        const notification = await Effect.runPromise(
          Notification.create({
            title: "Test",
            body: "Body",
            createdById: "user-789",
          }),
        );

        expect(notification.wasCreatedBy("user-789")).toBe(true);
        expect(notification.wasCreatedBy("user-456")).toBe(false);
      });
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("immutability", () => {
    it("original notification is unchanged after transition", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Test",
          body: "Body",
          createdById: "user-123",
        }),
      );

      const originalStatus = draft.status;
      await Effect.runPromise(draft.markReady());

      expect(draft.status).toBe(originalStatus);
      expect(draft.status).toBe(NotificationStatus.DRAFT);
    });

    it("original notification is unchanged after update", async () => {
      const draft = await Effect.runPromise(
        Notification.create({
          title: "Original",
          body: "Body",
          createdById: "user-123",
        }),
      );

      const originalTitle = draft.title;
      await Effect.runPromise(draft.update({ title: "Updated" }));

      expect(draft.title).toBe(originalTitle);
      expect(draft.title).toBe("Original");
    });

    it("updatedAt changes after any modification", async () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");

      const draft = await Effect.runPromise(
        Notification.create({
          title: "Test",
          body: "Body",
          createdAt,
          updatedAt: createdAt,
          createdById: "user-123",
        }),
      );

      const updated = await Effect.runPromise(draft.markReady());

      expect(updated.createdAt).toBe(createdAt);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
    });
  });
});
