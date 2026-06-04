import { notificationSchedules, trips, users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { normalizeScheduleWindow } from "@mirai-app/shared/notifications";
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

describe("notificationSchedule — real PGLite transaction rollback", () => {
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
  });

  it("rolls back schedule insert on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(notificationSchedules).values({
          id: "sched-1",
          name: "Test",
          notificationType: "custom",
          notificationTitle: "",
          notificationBody: "",
          startDate: now(),
          endDate: new Date(Date.now() + 86400000),
          hour: 9,
          minute: 0,
          createdAt: now(),
          updatedAt: now(),
          createdById: "user-1",
        });
        throw new Error("Simulated failure after insert");
      }),
    ).rejects.toThrow("Simulated failure after insert");

    const schedules = await testDb.db.select().from(notificationSchedules);
    expect(schedules).toHaveLength(0);
  });

  it("commits schedule insert when no failure", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(notificationSchedules).values({
        id: "sched-1",
        name: "Test",
        notificationType: "custom",
        notificationTitle: "",
        notificationBody: "",
        startDate: now(),
        endDate: new Date(Date.now() + 86400000),
        hour: 9,
        minute: 0,
        createdAt: now(),
        updatedAt: now(),
        createdById: "user-1",
      });
    });

    const schedules = await testDb.db.select().from(notificationSchedules);
    expect(schedules).toHaveLength(1);
  });
});

describe("notificationSchedule — Drizzle ORM PGLite integration", () => {
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
    // Seed schedules
    await testDb.db.insert(notificationSchedules).values({
      id: "sched-1",
      tripId: "trip-1",
      name: "Morning",
      notificationType: "custom",
      notificationTitle: "",
      notificationBody: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      hour: 7,
      minute: 30,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    await testDb.db.insert(notificationSchedules).values({
      id: "sched-2",
      tripId: "trip-1",
      name: "Evening",
      notificationType: "custom",
      notificationTitle: "",
      notificationBody: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      hour: 18,
      minute: 0,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
    await testDb.db.insert(notificationSchedules).values({
      id: "sched-3",
      tripId: "trip-1",
      name: "Inactive",
      notificationType: "custom",
      notificationTitle: "",
      notificationBody: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      hour: 12,
      minute: 0,
      isActive: false,
      createdAt: now(),
      updatedAt: now(),
      createdById: "user-1",
    });
  });

  it("queries all schedules via Drizzle ORM", async () => {
    const schedules = await testDb.db.select().from(notificationSchedules);
    expect(schedules).toHaveLength(3);
  });

  it("filters schedules by active status", async () => {
    const schedules = await testDb.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.isActive, true));
    expect(schedules).toHaveLength(2);
  });

  it("filters schedules by tripId", async () => {
    const schedules = await testDb.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.tripId, "trip-1"));
    expect(schedules).toHaveLength(3);
  });

  it("normalizes schedule window with real dates", () => {
    const startDate = new Date("2024-01-15T00:00:00Z");
    const endDate = new Date("2024-01-20T00:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 9,
      minute: 30,
    });
    expect(result.startDate.getUTCHours()).toBe(9);
    expect(result.startDate.getUTCMinutes()).toBe(30);
    expect(result.endDate.getTime() - result.startDate.getTime()).toBe(5 * 24 * 60 * 60 * 1000);
  });

  it("updates schedule status via Drizzle ORM", async () => {
    await testDb.db
      .update(notificationSchedules)
      .set({ isActive: false })
      .where(eq(notificationSchedules.id, "sched-1"));

    const schedules = await testDb.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.isActive, false));
    expect(schedules).toHaveLength(2);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(notificationSchedules).values({
          id: "sched-4",
          name: "New",
          notificationType: "custom",
          notificationTitle: "",
          notificationBody: "",
          startDate: now(),
          endDate: new Date(Date.now() + 86400000),
          hour: 10,
          minute: 0,
          createdAt: now(),
          updatedAt: now(),
          createdById: "user-1",
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const schedules = await testDb.db.select().from(notificationSchedules);
    expect(schedules).toHaveLength(3);
  });
});
