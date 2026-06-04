import { notificationDeliveries, notifications, trips, users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { buildDeliveryStatus, extractErrorMessage } from "@mirai-app/shared/notifications";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

describe("notificationSender — real PGLite transaction rollback", () => {
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
    // Seed delivery
    await testDb.db.insert(notificationDeliveries).values({
      id: "del-1",
      tripId: "trip-1",
      notificationId: "notif-1",
      deliveryStartedAt: now(),
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("rolls back delivery update on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(notificationDeliveries)
          .set({
            status: "success",
            successCount: 10,
            failureCount: 0,
          })
          .where(eq(notificationDeliveries.notificationId, "notif-1"));
        throw new Error("Simulated failure after update");
      }),
    ).rejects.toThrow("Simulated failure after update");

    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("pending");
    expect(deliveries[0].successCount).toBe(0);
  });

  it("commits delivery update when no failure", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(notificationDeliveries)
        .set({
          status: "success",
          successCount: 10,
          failureCount: 0,
        })
        .where(eq(notificationDeliveries.notificationId, "notif-1"));
    });

    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("success");
    expect(deliveries[0].successCount).toBe(10);
  });
});

describe("notificationSender — Drizzle ORM PGLite integration", () => {
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
    // Seed delivery
    await testDb.db.insert(notificationDeliveries).values({
      id: "del-1",
      tripId: "trip-1",
      notificationId: "notif-1",
      deliveryStartedAt: now(),
      status: "pending",
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("updates delivery status via Drizzle ORM", async () => {
    const status = buildDeliveryStatus(10, 0);
    expect(status).toBe("success");

    await testDb.db
      .update(notificationDeliveries)
      .set({
        status,
        successCount: 10,
        failureCount: 0,
        deliveryCompletedAt: now(),
      })
      .where(eq(notificationDeliveries.notificationId, "notif-1"));

    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("success");
    expect(deliveries[0].successCount).toBe(10);
  });

  it("extracts error message from Error object", () => {
    const error = new Error("Database connection failed");
    const message = extractErrorMessage(error);
    expect(message).toBe("Database connection failed");
  });

  it("extracts error message from string", () => {
    const message = extractErrorMessage("Service unavailable");
    expect(message).toBe("Service unavailable");
  });

  it("updates delivery with failure status", async () => {
    const status = buildDeliveryStatus(0, 10);
    expect(status).toBe("failure");

    const errorMessage = extractErrorMessage(new Error("All tokens invalid"));

    await testDb.db
      .update(notificationDeliveries)
      .set({
        status,
        successCount: 0,
        failureCount: 10,
        errors: errorMessage,
        deliveryCompletedAt: now(),
      })
      .where(eq(notificationDeliveries.notificationId, "notif-1"));

    const deliveries = await testDb.db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.notificationId, "notif-1"));
    expect(deliveries[0].status).toBe("failure");
    expect(deliveries[0].errors).toBe("All tokens invalid");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(notificationDeliveries).values({
          id: "del-2",
          notificationId: "notif-2",
          deliveryStartedAt: now(),
          status: "pending",
          createdAt: now(),
          updatedAt: now(),
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const deliveries = await testDb.db.select().from(notificationDeliveries);
    expect(deliveries).toHaveLength(1);
  });
});
