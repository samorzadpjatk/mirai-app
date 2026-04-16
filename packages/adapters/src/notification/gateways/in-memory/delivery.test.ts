import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryNotificationDeliveryGateway } from "./delivery";
import type { NotificationDeliveryDTO } from "@mirai-app/use-cases";

describe("[UNIT] InMemoryNotificationDeliveryGateway", () => {
  let gateway: InMemoryNotificationDeliveryGateway;

  beforeEach(() => {
    gateway = new InMemoryNotificationDeliveryGateway();
  });

  // ============================================================================
  // Test Data Factory
  // ============================================================================

  function createMockDelivery(
    overrides: Partial<NotificationDeliveryDTO> = {},
  ): NotificationDeliveryDTO {
    return {
      id: `delivery-${Math.random().toString(36).substring(7)}`,
      notificationId: "notification-1",
      userId: "user-1",
      channel: "push",
      status: "pending",
      sentAt: new Date("2024-01-15T10:00:00Z"),
      deliveredAt: null,
      failedAt: null,
      failureReason: null,
      retryCount: 0,
      ...overrides,
    };
  }

  // ============================================================================
  // seed() and reset() Tests
  // ============================================================================

  describe("seed() and reset()", () => {
    it("seed adds deliveries to storage", async () => {
      const delivery1 = createMockDelivery({ id: "delivery-1" });
      const delivery2 = createMockDelivery({ id: "delivery-2" });

      gateway.seed([delivery1, delivery2]);

      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(2);
    });

    it("reset clears all deliveries", async () => {
      const delivery = createMockDelivery({ id: "delivery-1" });
      gateway.seed([delivery]);

      gateway.reset();

      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(0);
    });

    it("multiple seeds accumulate data", async () => {
      const delivery1 = createMockDelivery({ id: "delivery-1" });
      const delivery2 = createMockDelivery({ id: "delivery-2" });
      const delivery3 = createMockDelivery({ id: "delivery-3" });

      gateway.seed([delivery1]);
      gateway.seed([delivery2, delivery3]);

      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(3);
    });

    it("reset after seed clears everything", async () => {
      const delivery1 = createMockDelivery({ id: "delivery-1" });
      const delivery2 = createMockDelivery({ id: "delivery-2" });
      gateway.seed([delivery1, delivery2]);

      gateway.reset();

      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(0);
    });
  });

  // ============================================================================
  // count() Tests
  // ============================================================================

  describe("count()", () => {
    it("counts all deliveries without filters", async () => {
      const delivery1 = createMockDelivery({ id: "delivery-1" });
      const delivery2 = createMockDelivery({ id: "delivery-2" });
      const delivery3 = createMockDelivery({ id: "delivery-3" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(3);
    });

    it("counts with pending status filter", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "pending" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({ id: "d3", status: "pending" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ status: "pending" }),
      );
      expect(count).toBe(2);
    });

    it("counts with success status filter", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "pending" });
      const delivery3 = createMockDelivery({ id: "d3", status: "success" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ status: "success" }),
      );
      expect(count).toBe(2);
    });

    it("counts with failure status filter", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "failure" });
      const delivery2 = createMockDelivery({ id: "d2", status: "pending" });
      const delivery3 = createMockDelivery({ id: "d3", status: "failure" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ status: "failure" }),
      );
      expect(count).toBe(2);
    });

    it("counts with partial_failure status filter", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        status: "partial_failure",
      });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({
        id: "d3",
        status: "partial_failure",
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ status: "partial_failure" }),
      );
      expect(count).toBe(2);
    });

    it("counts with scheduleId filter using notificationId field", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        notificationId: "schedule-1",
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        notificationId: "schedule-2",
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        notificationId: "schedule-1",
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ scheduleId: "schedule-1" }),
      );
      expect(count).toBe(2);
    });

    it("counts with startDate filter", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        sentAt: new Date("2024-01-15T10:00:00Z"),
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        sentAt: new Date("2024-01-16T10:00:00Z"),
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        sentAt: new Date("2024-01-14T10:00:00Z"),
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ startDate: new Date("2024-01-15T00:00:00Z") }),
      );
      expect(count).toBe(2);
    });

    it("counts with endDate filter", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        sentAt: new Date("2024-01-15T10:00:00Z"),
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        sentAt: new Date("2024-01-16T10:00:00Z"),
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        sentAt: new Date("2024-01-14T10:00:00Z"),
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(
        gateway.count({ endDate: new Date("2024-01-15T23:59:59Z") }),
      );
      expect(count).toBe(2);
    });

    it("counts with combined filters", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        notificationId: "schedule-1",
        status: "success",
        sentAt: new Date("2024-01-15T10:00:00Z"),
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        notificationId: "schedule-1",
        status: "failure",
        sentAt: new Date("2024-01-15T12:00:00Z"),
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        notificationId: "schedule-2",
        status: "success",
        sentAt: new Date("2024-01-15T10:00:00Z"),
      });
      const delivery4 = createMockDelivery({
        id: "d4",
        notificationId: "schedule-1",
        status: "success",
        sentAt: new Date("2024-01-16T10:00:00Z"),
      });

      gateway.seed([delivery1, delivery2, delivery3, delivery4]);

      const count = await Effect.runPromise(
        gateway.count({
          scheduleId: "schedule-1",
          status: "success",
          startDate: new Date("2024-01-15T00:00:00Z"),
          endDate: new Date("2024-01-15T23:59:59Z"),
        }),
      );
      expect(count).toBe(1);
    });

    it("returns 0 when no matches", async () => {
      const delivery = createMockDelivery({
        id: "d1",
        status: "pending",
      });

      gateway.seed([delivery]);

      const count = await Effect.runPromise(
        gateway.count({ status: "success" }),
      );
      expect(count).toBe(0);
    });

    it("returns 0 when storage is empty", async () => {
      const count = await Effect.runPromise(gateway.count());
      expect(count).toBe(0);
    });

    it("handles null sentAt dates in date filtering", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        sentAt: null,
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        sentAt: new Date("2024-01-15T10:00:00Z"),
      });

      gateway.seed([delivery1, delivery2]);

      const count = await Effect.runPromise(
        gateway.count({ startDate: new Date("2024-01-15T00:00:00Z") }),
      );
      expect(count).toBe(1);
    });
  });

  // ============================================================================
  // getStats() Tests
  // ============================================================================

  describe("getStats()", () => {
    it("returns stats with no filters (full dataset)", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "failure" });
      const delivery3 = createMockDelivery({ id: "d3", status: "pending" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.totalDeliveries).toBe(3);
      expect(stats.totalRecipients).toBe(3);
      expect(stats.totalSuccess).toBe(1);
      expect(stats.totalFailures).toBe(1);
      expect(stats.successRate).toBeCloseTo(33.33, 1);
    });

    it("returns stats with status filter", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({ id: "d3", status: "failure" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const stats = await Effect.runPromise(
        gateway.getStats({ status: "success" }),
      );

      expect(stats.totalDeliveries).toBe(2);
      expect(stats.totalSuccess).toBe(2);
      expect(stats.totalFailures).toBe(0);
      expect(stats.successRate).toBe(100);
    });

    it("returns stats with scheduleId filter", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        notificationId: "schedule-1",
        status: "success",
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        notificationId: "schedule-1",
        status: "failure",
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        notificationId: "schedule-2",
        status: "success",
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const stats = await Effect.runPromise(
        gateway.getStats({ scheduleId: "schedule-1" }),
      );

      expect(stats.totalDeliveries).toBe(2);
      expect(stats.totalSuccess).toBe(1);
      expect(stats.totalFailures).toBe(1);
    });

    it("returns stats with date range filter", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        sentAt: new Date("2024-01-15T10:00:00Z"),
        status: "success",
      });
      const delivery2 = createMockDelivery({
        id: "d2",
        sentAt: new Date("2024-01-16T10:00:00Z"),
        status: "failure",
      });
      const delivery3 = createMockDelivery({
        id: "d3",
        sentAt: new Date("2024-01-14T10:00:00Z"),
        status: "success",
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const stats = await Effect.runPromise(
        gateway.getStats({
          startDate: new Date("2024-01-15T00:00:00Z"),
          endDate: new Date("2024-01-16T23:59:59Z"),
        }),
      );

      expect(stats.totalDeliveries).toBe(2);
      expect(stats.totalSuccess).toBe(1);
      expect(stats.totalFailures).toBe(1);
    });

    it("calculates 0% success rate correctly", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "failure" });
      const delivery2 = createMockDelivery({ id: "d2", status: "failure" });

      gateway.seed([delivery1, delivery2]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.successRate).toBe(0);
    });

    it("calculates 50% success rate correctly", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "failure" });

      gateway.seed([delivery1, delivery2]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.successRate).toBe(50);
    });

    it("calculates 100% success rate correctly", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });

      gateway.seed([delivery1, delivery2]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.successRate).toBe(100);
    });

    it("handles empty result with 0 totalDeliveries", async () => {
      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.totalDeliveries).toBe(0);
      expect(stats.totalRecipients).toBe(0);
      expect(stats.totalSuccess).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.avgSuccessPerDelivery).toBe(0);
      expect(stats.avgFailuresPerDelivery).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it("includes all statuses in status breakdown", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "pending" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({
        id: "d3",
        status: "partial_failure",
      });
      const delivery4 = createMockDelivery({ id: "d4", status: "failure" });

      gateway.seed([delivery1, delivery2, delivery3, delivery4]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.statusBreakdown.pending).toBe(1);
      expect(stats.statusBreakdown.success).toBe(1);
      expect(stats.statusBreakdown.partial_failure).toBe(1);
      expect(stats.statusBreakdown.failure).toBe(1);
    });

    it("calculates correct average success and failures", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({ id: "d3", status: "failure" });
      const delivery4 = createMockDelivery({ id: "d4", status: "failure" });

      gateway.seed([delivery1, delivery2, delivery3, delivery4]);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.avgSuccessPerDelivery).toBe(0.5);
      expect(stats.avgFailuresPerDelivery).toBe(0.5);
    });

    it("handles multiple deliveries with different statuses", async () => {
      const deliveries = [
        createMockDelivery({ id: "d1", status: "success" }),
        createMockDelivery({ id: "d2", status: "success" }),
        createMockDelivery({ id: "d3", status: "success" }),
        createMockDelivery({ id: "d4", status: "failure" }),
        createMockDelivery({ id: "d5", status: "partial_failure" }),
        createMockDelivery({ id: "d6", status: "pending" }),
      ];

      gateway.seed(deliveries);

      const stats = await Effect.runPromise(gateway.getStats());

      expect(stats.totalDeliveries).toBe(6);
      expect(stats.totalSuccess).toBe(3);
      expect(stats.totalFailures).toBe(2);
      expect(stats.successRate).toBeCloseTo(50, 0);
    });
  });

  // ============================================================================
  // countFailed() Tests
  // ============================================================================

  describe("countFailed()", () => {
    it("counts deliveries with failure status", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "failure" });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({ id: "d3", status: "failure" });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(gateway.countFailed("trip-1"));
      expect(count).toBe(2);
    });

    it("counts deliveries with partial_failure status", async () => {
      const delivery1 = createMockDelivery({
        id: "d1",
        status: "partial_failure",
      });
      const delivery2 = createMockDelivery({ id: "d2", status: "success" });
      const delivery3 = createMockDelivery({
        id: "d3",
        status: "partial_failure",
      });

      gateway.seed([delivery1, delivery2, delivery3]);

      const count = await Effect.runPromise(gateway.countFailed("trip-1"));
      expect(count).toBe(2);
    });

    it("counts mixed failure statuses (failure and partial_failure)", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "failure" });
      const delivery2 = createMockDelivery({
        id: "d2",
        status: "partial_failure",
      });
      const delivery3 = createMockDelivery({ id: "d3", status: "success" });
      const delivery4 = createMockDelivery({ id: "d4", status: "pending" });

      gateway.seed([delivery1, delivery2, delivery3, delivery4]);

      const count = await Effect.runPromise(gateway.countFailed("trip-1"));
      expect(count).toBe(2);
    });

    it("returns 0 when no failures", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "success" });
      const delivery2 = createMockDelivery({ id: "d2", status: "pending" });

      gateway.seed([delivery1, delivery2]);

      const count = await Effect.runPromise(gateway.countFailed("trip-1"));
      expect(count).toBe(0);
    });

    it("returns 0 when storage is empty", async () => {
      const count = await Effect.runPromise(gateway.countFailed("trip-1"));
      expect(count).toBe(0);
    });

    it("ignores tripId parameter and counts all failures", async () => {
      const delivery1 = createMockDelivery({ id: "d1", status: "failure" });
      const delivery2 = createMockDelivery({ id: "d2", status: "failure" });

      gateway.seed([delivery1, delivery2]);

      const count = await Effect.runPromise(gateway.countFailed("any-trip-id"));
      expect(count).toBe(2);
    });
  });

  // ============================================================================
  // Not Implemented Methods Tests
  // ============================================================================

  describe("not implemented methods", () => {
    it("findByNotificationId returns Effect.fail with Error", async () => {
      const result = await Effect.runPromise(
        Effect.either(gateway.findByNotificationId("notification-1")),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(Error);
        expect((result.left as Error).message).toBe(
          "findByNotificationId not implemented",
        );
      }
    });

    it("findMany returns Effect.fail with Error", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          gateway.findMany({ tripId: "trip-1" }, { limit: 10, offset: 0 }),
        ),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(Error);
        expect((result.left as Error).message).toBe("findMany not implemented");
      }
    });

    it("findFailed returns Effect.fail with Error", async () => {
      const result = await Effect.runPromise(
        Effect.either(gateway.findFailed("trip-1", { limit: 10, offset: 0 })),
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(Error);
        expect((result.left as Error).message).toBe(
          "findFailed not implemented",
        );
      }
    });
  });
});
