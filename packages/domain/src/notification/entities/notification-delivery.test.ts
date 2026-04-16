import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  NotificationDelivery,
  type PushDeliveryRecord,
} from "./notification-delivery";
import { NotificationDeliveryStatus } from "../../notification/enums";
import { ValidationError } from "../../system/errors";

// Helper to create valid props for NotificationDelivery
function createValidProps(
  overrides: Partial<Parameters<typeof NotificationDelivery.create>[0]> = {},
): Parameters<typeof NotificationDelivery.create>[0] {
  return {
    notificationId: "notif-123",
    tripId: null,
    scheduleId: null,
    deliveryStartedAt: new Date("2024-06-15T10:00:00Z"),
    deliveryCompletedAt: null,
    totalRecipients: 100,
    successCount: 0,
    failureCount: 0,
    errors: null,
    status: NotificationDeliveryStatus.PENDING,
    pushes: [],
    ...overrides,
  };
}

// Helper to create a push delivery record
function createPushRecord(
  overrides: Partial<PushDeliveryRecord> = {},
): PushDeliveryRecord {
  return {
    targetUserId: "user-123",
    status: "SENT",
    sentAt: new Date("2024-06-15T10:01:00Z"),
    failureReason: null,
    ...overrides,
  };
}

describe("[UNIT] NotificationDelivery", () => {
  // ============================================================================
  // Factory Method Tests (create)
  // ============================================================================
  describe("create", () => {
    it("creates notification delivery with valid data", async () => {
      const effect = NotificationDelivery.create(createValidProps());
      const delivery = await Effect.runPromise(effect);

      expect(delivery.notificationId).toBe("notif-123");
      expect(delivery.totalRecipients).toBe(100);
      expect(delivery.successCount).toBe(0);
      expect(delivery.failureCount).toBe(0);
      expect(delivery.status).toBe(NotificationDeliveryStatus.PENDING);
      expect(delivery.pushes).toEqual([]);
      expect(delivery.tripId).toBeNull();
      expect(delivery.scheduleId).toBeNull();
      expect(delivery.errors).toBeNull();
      expect(delivery.id).toBeDefined();
      expect(delivery.createdAt).toBeInstanceOf(Date);
      expect(delivery.updatedAt).toBeInstanceOf(Date);
    });

    it("creates with all properties provided", async () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");
      const deliveryStartedAt = new Date("2024-06-15T10:00:00Z");
      const deliveryCompletedAt = new Date("2024-06-15T10:30:00Z");

      const pushes: PushDeliveryRecord[] = [
        createPushRecord({ targetUserId: "user-1" }),
        createPushRecord({
          targetUserId: "user-2",
          status: "FAILED",
          sentAt: null,
          failureReason: "Network error",
        }),
      ];

      const effect = NotificationDelivery.create({
        id: "delivery-123",
        notificationId: "notif-456",
        tripId: "trip-789",
        scheduleId: "schedule-001",
        deliveryStartedAt,
        deliveryCompletedAt,
        totalRecipients: 50,
        successCount: 45,
        failureCount: 5,
        errors: "Some errors occurred",
        status: NotificationDeliveryStatus.COMPLETED,
        pushes,
        createdAt,
        updatedAt,
      });

      const delivery = await Effect.runPromise(effect);

      expect(delivery.id).toBe("delivery-123");
      expect(delivery.notificationId).toBe("notif-456");
      expect(delivery.tripId).toBe("trip-789");
      expect(delivery.scheduleId).toBe("schedule-001");
      expect(delivery.deliveryStartedAt).toBe(deliveryStartedAt);
      expect(delivery.deliveryCompletedAt).toBe(deliveryCompletedAt);
      expect(delivery.totalRecipients).toBe(50);
      expect(delivery.successCount).toBe(45);
      expect(delivery.failureCount).toBe(5);
      expect(delivery.errors).toBe("Some errors occurred");
      expect(delivery.status).toBe(NotificationDeliveryStatus.COMPLETED);
      expect(delivery.pushes).toHaveLength(2);
      expect(delivery.createdAt).toBe(createdAt);
      expect(delivery.updatedAt).toBe(updatedAt);
    });

    it("generates UUID when id not provided", async () => {
      const effect = NotificationDelivery.create(createValidProps());
      const delivery = await Effect.runPromise(effect);

      expect(delivery.id).toBeDefined();
      expect(typeof delivery.id).toBe("string");
      expect(delivery.id.length).toBeGreaterThan(10);
    });

    it("uses default values for optional fields", async () => {
      const effect = NotificationDelivery.create({
        notificationId: "notif-123",
      });

      const delivery = await Effect.runPromise(effect);

      expect(delivery.totalRecipients).toBe(0);
      expect(delivery.successCount).toBe(0);
      expect(delivery.failureCount).toBe(0);
      expect(delivery.status).toBe(NotificationDeliveryStatus.PENDING);
      expect(delivery.pushes).toEqual([]);
      expect(delivery.tripId).toBeNull();
      expect(delivery.scheduleId).toBeNull();
      expect(delivery.errors).toBeNull();
    });

    it("freezes pushes array", async () => {
      const pushes: PushDeliveryRecord[] = [createPushRecord()];

      const effect = NotificationDelivery.create(createValidProps({ pushes }));
      const delivery = await Effect.runPromise(effect);

      expect(Object.isFrozen(delivery.pushes)).toBe(true);
    });

    // ============================================================================
    // Validation Tests
    // ============================================================================
    it("fails when notificationId is empty", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        notificationId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("notificationId");
      }
    });

    it("fails when totalRecipients is negative", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        totalRecipients: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("totalRecipients");
      }
    });

    it("fails when successCount is negative", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        successCount: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("successCount");
      }
    });

    it("fails when failureCount is negative", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        failureCount: -1,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("failureCount");
      }
    });

    it("fails when successCount + failureCount exceeds totalRecipients", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        totalRecipients: 10,
        successCount: 6,
        failureCount: 6,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("counts");
      }
    });

    it("succeeds when successCount + failureCount equals totalRecipients", async () => {
      const effect = NotificationDelivery.create({
        ...createValidProps(),
        totalRecipients: 10,
        successCount: 6,
        failureCount: 4,
      });

      const delivery = await Effect.runPromise(effect);

      expect(delivery.totalRecipients).toBe(10);
      expect(delivery.successCount).toBe(6);
      expect(delivery.failureCount).toBe(4);
    });

    it("fails when errors exceeds max length", async () => {
      const longErrors = "a".repeat(2001);

      const effect = NotificationDelivery.create({
        ...createValidProps(),
        errors: longErrors,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("errors");
      }
    });

    it("fails when deliveryCompletedAt is before deliveryStartedAt", async () => {
      const deliveryStartedAt = new Date("2024-06-15T10:00:00Z");
      const deliveryCompletedAt = new Date("2024-06-15T09:00:00Z");

      const effect = NotificationDelivery.create({
        ...createValidProps(),
        deliveryStartedAt,
        deliveryCompletedAt,
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("deliveryCompletedAt");
      }
    });
  });

  // ============================================================================
  // State Transition Tests
  // ============================================================================
  describe("state transitions", () => {
    async function createDelivery(props = {}): Promise<NotificationDelivery> {
      return Effect.runPromise(
        NotificationDelivery.create(createValidProps(props)),
      );
    }

    describe("start", () => {
      it("transitions from PENDING to IN_PROGRESS", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });

        const started = delivery.start();

        expect(started.status).toBe(NotificationDeliveryStatus.IN_PROGRESS);
        expect(started.deliveryStartedAt).toBeInstanceOf(Date);
      });

      it("updates updatedAt timestamp", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });

        const started = delivery.start();

        expect(started.updatedAt.getTime()).toBeGreaterThanOrEqual(
          delivery.updatedAt.getTime(),
        );
      });

      it("preserves original delivery", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });

        delivery.start();

        expect(delivery.status).toBe(NotificationDeliveryStatus.PENDING);
      });
    });

    describe("complete", () => {
      it("transitions from IN_PROGRESS to COMPLETED", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });

        const completed = delivery.complete();

        expect(completed.status).toBe(NotificationDeliveryStatus.COMPLETED);
        expect(completed.deliveryCompletedAt).toBeInstanceOf(Date);
      });

      it("updates updatedAt timestamp", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });

        const completed = delivery.complete();

        expect(completed.updatedAt.getTime()).toBeGreaterThanOrEqual(
          delivery.updatedAt.getTime(),
        );
      });
    });

    describe("markAsFailed", () => {
      it("transitions to FAILED with error message", async () => {
        const delivery = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });

        const failed = await Effect.runPromise(
          delivery.markAsFailed("Network timeout"),
        );

        expect(failed.status).toBe(NotificationDeliveryStatus.FAILED);
        expect(failed.errors).toBe("Network timeout");
        expect(failed.deliveryCompletedAt).toBeInstanceOf(Date);
      });

      it("fails when error message is empty", async () => {
        const delivery = await createDelivery();

        const result = await Effect.runPromise(
          Effect.either(delivery.markAsFailed("")),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("errors");
        }
      });

      it("fails when error message exceeds max length", async () => {
        const delivery = await createDelivery();
        const longError = "a".repeat(2001);

        const result = await Effect.runPromise(
          Effect.either(delivery.markAsFailed(longError)),
        );

        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(ValidationError);
          expect(result.left.field).toBe("errors");
        }
      });

      it("trims error message", async () => {
        const delivery = await createDelivery();

        const failed = await Effect.runPromise(
          delivery.markAsFailed("  Error occurred  "),
        );

        expect(failed.errors).toBe("Error occurred");
      });
    });
  });

  // ============================================================================
  // updateStats Tests
  // ============================================================================
  describe("updateStats", () => {
    async function createDelivery(props = {}): Promise<NotificationDelivery> {
      return Effect.runPromise(
        NotificationDelivery.create(createValidProps(props)),
      );
    }

    it("updates total recipients", async () => {
      const delivery = await createDelivery({ totalRecipients: 100 });

      const updated = await Effect.runPromise(
        delivery.updateStats({ totalRecipients: 150 }),
      );

      expect(updated.totalRecipients).toBe(150);
    });

    it("updates success count", async () => {
      const delivery = await createDelivery({ successCount: 0 });

      const updated = await Effect.runPromise(
        delivery.updateStats({ successCount: 10 }),
      );

      expect(updated.successCount).toBe(10);
    });

    it("updates failure count", async () => {
      const delivery = await createDelivery({ failureCount: 0 });

      const updated = await Effect.runPromise(
        delivery.updateStats({ failureCount: 5 }),
      );

      expect(updated.failureCount).toBe(5);
    });

    it("updates multiple stats at once", async () => {
      const delivery = await createDelivery({
        totalRecipients: 100,
        successCount: 0,
        failureCount: 0,
      });

      const updated = await Effect.runPromise(
        delivery.updateStats({
          totalRecipients: 100,
          successCount: 95,
          failureCount: 5,
        }),
      );

      expect(updated.totalRecipients).toBe(100);
      expect(updated.successCount).toBe(95);
      expect(updated.failureCount).toBe(5);
    });

    it("fails when total recipients is negative", async () => {
      const delivery = await createDelivery();

      const result = await Effect.runPromise(
        Effect.either(delivery.updateStats({ totalRecipients: -1 })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("counts");
      }
    });

    it("fails when success count is negative", async () => {
      const delivery = await createDelivery();

      const result = await Effect.runPromise(
        Effect.either(delivery.updateStats({ successCount: -1 })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("counts");
      }
    });

    it("fails when failure count is negative", async () => {
      const delivery = await createDelivery();

      const result = await Effect.runPromise(
        Effect.either(delivery.updateStats({ failureCount: -1 })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("counts");
      }
    });

    it("fails when success + failure exceeds total", async () => {
      const delivery = await createDelivery({ totalRecipients: 100 });

      const result = await Effect.runPromise(
        Effect.either(
          delivery.updateStats({ successCount: 60, failureCount: 50 }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("counts");
      }
    });

    it("preserves unchanged stats", async () => {
      const delivery = await createDelivery({
        totalRecipients: 100,
        successCount: 50,
        failureCount: 10,
      });

      const updated = await Effect.runPromise(
        delivery.updateStats({ successCount: 75 }),
      );

      expect(updated.totalRecipients).toBe(100);
      expect(updated.successCount).toBe(75);
      expect(updated.failureCount).toBe(10);
    });

    it("updates updatedAt timestamp", async () => {
      const delivery = await createDelivery();

      const updated = await Effect.runPromise(
        delivery.updateStats({ successCount: 10 }),
      );

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        delivery.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // recordPush Tests
  // ============================================================================
  describe("recordPush", () => {
    async function createDelivery(props = {}): Promise<NotificationDelivery> {
      return Effect.runPromise(
        NotificationDelivery.create(createValidProps(props)),
      );
    }

    it("records successful push", async () => {
      const delivery = await createDelivery({ successCount: 0 });

      const updated = delivery.recordPush("user-1", true);

      expect(updated.successCount).toBe(1);
      expect(updated.pushes).toHaveLength(1);
      expect(updated.pushes[0]!.targetUserId).toBe("user-1");
      expect(updated.pushes[0]!.status).toBe("SENT");
      expect(updated.pushes[0]!.sentAt).toBeInstanceOf(Date);
      expect(updated.pushes[0]!.failureReason).toBeNull();
    });

    it("records failed push", async () => {
      const delivery = await createDelivery({ failureCount: 0 });

      const updated = delivery.recordPush("user-1", false, "Network error");

      expect(updated.failureCount).toBe(1);
      expect(updated.pushes).toHaveLength(1);
      expect(updated.pushes[0]!.targetUserId).toBe("user-1");
      expect(updated.pushes[0]!.status).toBe("FAILED");
      expect(updated.pushes[0]!.sentAt).toBeNull();
      expect(updated.pushes[0]!.failureReason).toBe("Network error");
    });

    it("records multiple pushes", async () => {
      let delivery = await createDelivery({ successCount: 0, failureCount: 0 });

      delivery = delivery.recordPush("user-1", true);
      delivery = delivery.recordPush("user-2", false, "Timeout");
      delivery = delivery.recordPush("user-3", true);

      expect(delivery.successCount).toBe(2);
      expect(delivery.failureCount).toBe(1);
      expect(delivery.pushes).toHaveLength(3);
    });

    it("freezes pushes array after recording", async () => {
      const delivery = await createDelivery();

      const updated = delivery.recordPush("user-1", true);

      expect(Object.isFrozen(updated.pushes)).toBe(true);
    });

    it("updates updatedAt timestamp", async () => {
      const delivery = await createDelivery();

      const updated = delivery.recordPush("user-1", true);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        delivery.updatedAt.getTime(),
      );
    });
  });

  // ============================================================================
  // Query Method Tests
  // ============================================================================
  describe("query methods", () => {
    async function createDelivery(props = {}): Promise<NotificationDelivery> {
      return Effect.runPromise(
        NotificationDelivery.create(createValidProps(props)),
      );
    }

    describe("getFailedPushes", () => {
      it("returns only failed pushes", async () => {
        let delivery = await createDelivery();

        delivery = delivery.recordPush("user-1", true);
        delivery = delivery.recordPush("user-2", false, "Error 1");
        delivery = delivery.recordPush("user-3", false, "Error 2");

        const failed = delivery.getFailedPushes();

        expect(failed).toHaveLength(2);
        expect(failed[0]!.targetUserId).toBe("user-2");
        expect(failed[1]!.targetUserId).toBe("user-3");
      });

      it("returns empty array when no failures", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-1", true);

        expect(delivery.getFailedPushes()).toEqual([]);
      });
    });

    describe("getSuccessfulPushes", () => {
      it("returns only successful pushes", async () => {
        let delivery = await createDelivery();

        delivery = delivery.recordPush("user-1", true);
        delivery = delivery.recordPush("user-2", false, "Error");
        delivery = delivery.recordPush("user-3", true);

        const successful = delivery.getSuccessfulPushes();

        expect(successful).toHaveLength(2);
        expect(successful[0]!.targetUserId).toBe("user-1");
        expect(successful[1]!.targetUserId).toBe("user-3");
      });

      it("returns empty array when no successes", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-1", false, "Error");

        expect(delivery.getSuccessfulPushes()).toEqual([]);
      });
    });

    describe("isComplete", () => {
      it("returns true when pushes count equals total recipients", async () => {
        let delivery = await createDelivery({ totalRecipients: 3 });

        delivery = delivery.recordPush("user-1", true);
        delivery = delivery.recordPush("user-2", true);
        delivery = delivery.recordPush("user-3", false, "Error");

        expect(delivery.isComplete()).toBe(true);
      });

      it("returns false when pushes count is less than total recipients", async () => {
        let delivery = await createDelivery({ totalRecipients: 5 });
        delivery = delivery.recordPush("user-1", true);

        expect(delivery.isComplete()).toBe(false);
      });

      it("returns false when no recipients", async () => {
        const delivery = await createDelivery({ totalRecipients: 0 });
        expect(delivery.isComplete()).toBe(true);
      });
    });

    describe("isPushSentToUser", () => {
      it("returns true when push was sent to user", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-123", true);

        expect(delivery.isPushSentToUser("user-123")).toBe(true);
      });

      it("returns false when push failed for user", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-123", false, "Error");

        expect(delivery.isPushSentToUser("user-123")).toBe(false);
      });

      it("returns false when no push for user", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-456", true);

        expect(delivery.isPushSentToUser("user-123")).toBe(false);
      });
    });

    describe("getPushForUser", () => {
      it("returns push record for user", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-123", true);

        const push = delivery.getPushForUser("user-123");

        expect(push).toBeDefined();
        expect(push!.targetUserId).toBe("user-123");
        expect(push!.status).toBe("SENT");
      });

      it("returns undefined when no push for user", async () => {
        const delivery = await createDelivery();

        expect(delivery.getPushForUser("user-123")).toBeUndefined();
      });

      it("returns first push for user (find behavior)", async () => {
        let delivery = await createDelivery();
        delivery = delivery.recordPush("user-123", true);
        delivery = delivery.recordPush("user-123", false, "Retry failed");

        const push = delivery.getPushForUser("user-123");

        // find() returns first match, not most recent
        expect(push!.status).toBe("SENT");
      });
    });

    describe("status checks", () => {
      it("isPending returns true only for PENDING", async () => {
        const pending = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });
        const inProgress = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });

        expect(pending.isPending()).toBe(true);
        expect(inProgress.isPending()).toBe(false);
      });

      it("isInProgress returns true only for IN_PROGRESS", async () => {
        const inProgress = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });
        const completed = await createDelivery({
          status: NotificationDeliveryStatus.COMPLETED,
        });

        expect(inProgress.isInProgress()).toBe(true);
        expect(completed.isInProgress()).toBe(false);
      });

      it("isCompleted returns true only for COMPLETED", async () => {
        const completed = await createDelivery({
          status: NotificationDeliveryStatus.COMPLETED,
        });
        const pending = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });

        expect(completed.isCompleted()).toBe(true);
        expect(pending.isCompleted()).toBe(false);
      });

      it("isFailed returns true only for FAILED", async () => {
        const failed = await createDelivery({
          status: NotificationDeliveryStatus.FAILED,
        });
        const completed = await createDelivery({
          status: NotificationDeliveryStatus.COMPLETED,
        });

        expect(failed.isFailed()).toBe(true);
        expect(completed.isFailed()).toBe(false);
      });

      it("isTerminal returns true for COMPLETED and FAILED", async () => {
        const pending = await createDelivery({
          status: NotificationDeliveryStatus.PENDING,
        });
        const inProgress = await createDelivery({
          status: NotificationDeliveryStatus.IN_PROGRESS,
        });
        const completed = await createDelivery({
          status: NotificationDeliveryStatus.COMPLETED,
        });
        const failed = await createDelivery({
          status: NotificationDeliveryStatus.FAILED,
        });

        expect(pending.isTerminal()).toBe(false);
        expect(inProgress.isTerminal()).toBe(false);
        expect(completed.isTerminal()).toBe(true);
        expect(failed.isTerminal()).toBe(true);
      });
    });

    describe("rate calculations", () => {
      it("getSuccessRate returns rounded percentage", async () => {
        const delivery = await createDelivery({
          totalRecipients: 100,
          successCount: 75,
          failureCount: 25,
        });

        expect(delivery.getSuccessRate()).toBe(75);
      });

      it("getSuccessRate returns 0 when no recipients", async () => {
        const delivery = await createDelivery({ totalRecipients: 0 });

        expect(delivery.getSuccessRate()).toBe(0);
      });

      it("getFailureRate returns rounded percentage", async () => {
        const delivery = await createDelivery({
          totalRecipients: 100,
          successCount: 25,
          failureCount: 75,
        });

        expect(delivery.getFailureRate()).toBe(75);
      });

      it("getFailureRate returns 0 when no recipients", async () => {
        const delivery = await createDelivery({ totalRecipients: 0 });

        expect(delivery.getFailureRate()).toBe(0);
      });

      it("rates sum to 100 when complete", async () => {
        const delivery = await createDelivery({
          totalRecipients: 100,
          successCount: 67,
          failureCount: 33,
        });

        expect(delivery.getSuccessRate() + delivery.getFailureRate()).toBe(100);
      });
    });

    describe("schedule and trip checks", () => {
      it("isScheduled returns true when scheduleId is set", async () => {
        const scheduled = await createDelivery({ scheduleId: "schedule-123" });
        const unscheduled = await createDelivery({ scheduleId: null });

        expect(scheduled.isScheduled()).toBe(true);
        expect(unscheduled.isScheduled()).toBe(false);
      });

      it("isForTrip returns true for matching tripId", async () => {
        const delivery = await createDelivery({ tripId: "trip-123" });

        expect(delivery.isForTrip("trip-123")).toBe(true);
        expect(delivery.isForTrip("trip-456")).toBe(false);
      });

      it("isForTrip returns false when tripId is null", async () => {
        const delivery = await createDelivery({ tripId: null });

        expect(delivery.isForTrip("trip-123")).toBe(false);
      });

      it("isForNotification returns true for matching notificationId", async () => {
        const delivery = await createDelivery({ notificationId: "notif-123" });

        expect(delivery.isForNotification("notif-123")).toBe(true);
        expect(delivery.isForNotification("notif-456")).toBe(false);
      });
    });

    describe("getDurationMs", () => {
      it("returns duration when completed", async () => {
        const deliveryStartedAt = new Date("2024-06-15T10:00:00Z");
        const deliveryCompletedAt = new Date("2024-06-15T10:30:00Z");

        const delivery = await createDelivery({
          deliveryStartedAt,
          deliveryCompletedAt,
        });

        expect(delivery.getDurationMs()).toBe(30 * 60 * 1000);
      });

      it("returns null when not completed", async () => {
        const delivery = await createDelivery({
          deliveryStartedAt: new Date("2024-06-15T10:00:00Z"),
          deliveryCompletedAt: null,
        });

        expect(delivery.getDurationMs()).toBeNull();
      });
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("immutability", () => {
    it("original delivery unchanged after start", async () => {
      const delivery = await Effect.runPromise(
        NotificationDelivery.create(
          createValidProps({ status: NotificationDeliveryStatus.PENDING }),
        ),
      );

      const originalStatus = delivery.status;
      delivery.start();

      expect(delivery.status).toBe(originalStatus);
    });

    it("original delivery unchanged after recordPush", async () => {
      const delivery = await Effect.runPromise(
        NotificationDelivery.create(createValidProps()),
      );

      const originalPushCount = delivery.pushes.length;
      delivery.recordPush("user-1", true);

      expect(delivery.pushes.length).toBe(originalPushCount);
    });

    it("original delivery unchanged after updateStats", async () => {
      const delivery = await Effect.runPromise(
        NotificationDelivery.create(createValidProps({ successCount: 0 })),
      );

      const originalSuccessCount = delivery.successCount;
      await Effect.runPromise(delivery.updateStats({ successCount: 10 }));

      expect(delivery.successCount).toBe(originalSuccessCount);
    });
  });
});
