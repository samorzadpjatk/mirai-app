import { notificationSchedules, notifications } from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { seedGroup, seedParticipant, seedTrip, seedUser } from "../../test-helpers";
import { runDueNotificationSchedules } from "../scheduleExecutor";

const sendMobileNotificationsMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ success: true, sent: 1, failed: 0, total: 1 }),
);

vi.mock("../notificationService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../notificationService")>();
  return {
    ...actual,
    sendMobileNotifications: sendMobileNotificationsMock,
  };
});

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

// Building the PGLite schema is slow on a loaded machine; the package-wide
// 60s hook timeout is not always enough.
beforeAll(async () => {
  testDb = await createPgliteTestDb();
}, 180_000);

beforeEach(async () => {
  await testDb.reset();
  sendMobileNotificationsMock.mockClear();
});

afterAll(async () => {
  await testDb.cleanup();
});

async function seedWorld() {
  await seedUser(testDb.db, "admin-1");
  await seedUser(testDb.db, "member-1");
  await seedUser(testDb.db, "member-2");
  await seedTrip(testDb.db, "trip-1", "Trip");
  await seedGroup(testDb.db, "group-1", "trip-1", "Alpha", "admin-1", "1111");
  await seedGroup(testDb.db, "group-2", "trip-1", "Beta", "admin-1", "2222");
  await seedParticipant(testDb.db, "participant-1", "member-1", "trip-1", "group-1");
  await seedParticipant(testDb.db, "participant-2", "member-2", "trip-1", "group-2");
}

async function seedSchedule(overrides: Record<string, unknown> = {}) {
  const [row] = await testDb.db
    .insert(notificationSchedules)
    .values({
      id: "schedule-1",
      tripId: "trip-1",
      name: "Daily",
      notificationType: "custom",
      notificationTitle: "Good morning",
      notificationBody: "Check the ranking",
      notificationUrl: "/trips/leaderboard",
      // 07:30 Europe/Warsaw == 06:30 UTC in January.
      startDate: new Date("2024-01-01T06:30:00Z"),
      endDate: new Date("2025-01-01T06:30:00Z"),
      hour: 7,
      minute: 30,
      isActive: true,
      createdById: "admin-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    })
    .returning();
  return row;
}

describe("runDueNotificationSchedules — PGLite", () => {
  it("fires a due schedule, creates the notification and pushes it", async () => {
    await seedWorld();
    await seedSchedule();

    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    expect(result).toMatchObject({ evaluated: 1, due: 1, fired: 1, failed: 0 });

    const created = await testDb.db.query.notifications.findMany();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      title: "Good morning",
      body: "Check the ranking",
      tripId: "trip-1",
      createdById: "admin-1",
    });

    expect(sendMobileNotificationsMock).toHaveBeenCalledTimes(1);
    expect(sendMobileNotificationsMock).toHaveBeenCalledWith(testDb.db, created[0]?.id);
  });

  it("addresses every trip participant and records the execution", async () => {
    await seedWorld();
    await seedSchedule();

    await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    const pushes = await testDb.db.query.notificationPushes.findMany();
    expect(pushes.map((push) => push.targetUserId).sort()).toEqual(["member-1", "member-2"]);

    const executions = await testDb.db.query.notificationScheduleExecutions.findMany();
    expect(executions).toHaveLength(1);
    expect(executions[0]?.scheduleId).toBe("schedule-1");
  });

  it("scopes the audience to one group when the URL says so", async () => {
    await seedWorld();
    await seedSchedule({ notificationUrl: "/alerts?__audience=group&__groupId=group-2" });

    await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    const pushes = await testDb.db.query.notificationPushes.findMany();
    expect(pushes.map((push) => push.targetUserId)).toEqual(["member-2"]);
  });

  it("records lastRun so the same occurrence never fires twice", async () => {
    await seedWorld();
    await seedSchedule();

    const now = new Date("2024-01-15T06:31:00Z");
    await runDueNotificationSchedules({ db: testDb.db, now });

    const afterFirst = await testDb.db.query.notificationSchedules.findFirst({
      where: (ns, { eq: equals }) => equals(ns.id, "schedule-1"),
    });
    expect(afterFirst?.lastRun?.toISOString()).toBe(now.toISOString());

    const second = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:35:00Z"),
    });
    expect(second).toMatchObject({ due: 0, fired: 0 });
    expect((await testDb.db.select().from(notifications)).length).toBe(1);
  });

  it("fires again on the following day", async () => {
    await seedWorld();
    await seedSchedule();

    await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });
    await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-16T06:31:00Z"),
    });

    expect((await testDb.db.select().from(notifications)).length).toBe(2);
  });

  it("fires a one-time schedule whose window is only two minutes wide", async () => {
    await seedWorld();
    await seedSchedule({
      hour: 13,
      minute: 0,
      startDate: new Date("2024-01-15T12:00:00Z"),
      endDate: new Date("2024-01-15T12:02:00Z"),
    });

    // Nine minutes late — a window-driven executor would already have skipped it.
    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T12:09:00Z"),
    });

    expect(result).toMatchObject({ due: 1, fired: 1 });
    expect((await testDb.db.select().from(notifications)).length).toBe(1);
  });

  it("ignores inactive schedules", async () => {
    await seedWorld();
    await seedSchedule({ isActive: false });

    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    expect(result).toMatchObject({ evaluated: 0, due: 0, fired: 0 });
    expect((await testDb.db.select().from(notifications)).length).toBe(0);
  });

  it("does not fire outside the grace window", async () => {
    await seedWorld();
    await seedSchedule();

    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T07:30:00Z"),
      graceMinutes: 15,
    });

    expect(result).toMatchObject({ due: 0, fired: 0 });
    expect((await testDb.db.select().from(notifications)).length).toBe(0);
  });

  it("skips a schedule with no trip rather than blasting every subscriber", async () => {
    await seedWorld();
    await seedSchedule({ tripId: null });

    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    expect(result).toMatchObject({ due: 1, fired: 0, skipped: 1 });
    expect((await testDb.db.select().from(notifications)).length).toBe(0);
    expect(sendMobileNotificationsMock).not.toHaveBeenCalled();
  });

  it("keeps the occurrence claimed when sending fails", async () => {
    await seedWorld();
    await seedSchedule();
    sendMobileNotificationsMock.mockRejectedValueOnce(new Error("expo unreachable"));

    const result = await runDueNotificationSchedules({
      db: testDb.db,
      now: new Date("2024-01-15T06:31:00Z"),
    });

    expect(result).toMatchObject({ due: 1, fired: 0, failed: 1 });

    const [schedule] = await testDb.db
      .select()
      .from(notificationSchedules)
      .where(eq(notificationSchedules.id, "schedule-1"));
    expect(schedule?.lastRun).not.toBeNull();
  });
});
