import { buildDeliveryStats } from "@mirai-app/common/notifications";
import { notificationDeliveries, notifications, trips, users } from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

describe("notificationDelivery — real PGLite transaction rollback", () => {
  beforeEach(async () => {
    // Seed required foreign key references
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(notifications).values({
      id: "notif-1",
      tripId: "trip-1",
      title: "Test",
      body: "Test body",
      url: "https://example.com",
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
  });

  it("rolls back delivery insert on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(notificationDeliveries).values({
          id: "del-1",
          notificationId: "notif-1",
          deliveryStartedAt: now(),
          status: "pending",
          createdAt: now(),
          updatedAt: now(),
        });
        throw new Error("Simulated failure after insert");
      }),
    ).rejects.toThrow("Simulated failure after insert");

    const deliveries = await testDb.db.select().from(notificationDeliveries);
    expect(deliveries).toHaveLength(0);
  });

  it("commits delivery insert when no failure", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(notificationDeliveries).values({
        id: "del-1",
        notificationId: "notif-1",
        deliveryStartedAt: now(),
        status: "pending",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const deliveries = await testDb.db.select().from(notificationDeliveries);
    expect(deliveries).toHaveLength(1);
  });
});

describe("notificationDelivery — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    // Seed required foreign key references
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(notifications).values({
      id: "notif-1",
      tripId: "trip-1",
      title: "Test",
      body: "Test body",
      url: "https://example.com",
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    await testDb.db.insert(notifications).values({
      id: "notif-2",
      tripId: "trip-1",
      title: "Test 2",
      body: "Test body 2",
      url: "https://example.com/2",
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    await testDb.db.insert(notifications).values({
      id: "notif-3",
      tripId: "trip-1",
      title: "Test 3",
      body: "Test body 3",
      url: "https://example.com/3",
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    await testDb.db.insert(notifications).values({
      id: "notif-4",
      tripId: "trip-1",
      title: "Test 4",
      body: "Test body 4",
      url: "https://example.com/4",
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    // Seed deliveries
    await testDb.db.insert(notificationDeliveries).values({
      id: "del-1",
      tripId: "trip-1",
      notificationId: "notif-1",
      deliveryStartedAt: now(),
      deliveryCompletedAt: now(),
      totalRecipients: 10,
      successCount: 8,
      failureCount: 2,
      status: "success",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(notificationDeliveries).values({
      id: "del-2",
      tripId: "trip-1",
      notificationId: "notif-2",
      deliveryStartedAt: now(),
      deliveryCompletedAt: now(),
      totalRecipients: 10,
      successCount: 0,
      failureCount: 10,
      status: "failure",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(notificationDeliveries).values({
      id: "del-3",
      tripId: "trip-1",
      notificationId: "notif-3",
      deliveryStartedAt: now(),
      deliveryCompletedAt: now(),
      totalRecipients: 10,
      successCount: 5,
      failureCount: 5,
      status: "partial_failure",
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("queries deliveries via Drizzle ORM", async () => {
    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.tripId, "trip-1"));
    expect(deliveries).toHaveLength(3);
  });

  it("filters deliveries by status", async () => {
    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.status, "success"));
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].notificationId).toBe("notif-1");
  });

  it("buildDeliveryStats works with real PGLite data", async () => {
    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.tripId, "trip-1"));

    const stats = buildDeliveryStats(deliveries.map((d) => ({ status: d.status })));
    expect(stats.total).toBe(3);
    expect(stats.successful).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.partial).toBe(1);
    expect(stats.successRate).toBe(33);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(notificationDeliveries).values({
          id: "del-4",
          notificationId: "notif-4",
          deliveryStartedAt: now(),
          status: "pending",
          createdAt: now(),
          updatedAt: now(),
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const deliveries = await testDb.db.select().from(notificationDeliveries);
    expect(deliveries).toHaveLength(3);
  });
});
