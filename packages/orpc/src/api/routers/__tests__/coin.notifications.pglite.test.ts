import { groups } from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createMockSupabase,
  seedGroup,
  seedParticipant,
  seedTrip,
  seedUser,
} from "../../../test-helpers";
import { addCoins, removeCoins } from "../coin/mutations";
import { addCoins as adjustCoinsViaGroup } from "../group/mutations";

const sendMobileNotificationsMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ success: true, sent: 1, failed: 0, total: 1 }),
);

vi.mock("../../../services/notificationService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../services/notificationService")>();
  return {
    ...actual,
    sendMobileNotifications: sendMobileNotificationsMock,
  };
});

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

beforeAll(async () => {
  testDb = await createPgliteTestDb();
}, 180_000);

beforeEach(async () => {
  await testDb.reset();
  sendMobileNotificationsMock.mockClear();

  await seedUser(testDb.db, "admin-1");
  await seedUser(testDb.db, "member-1");
  await seedUser(testDb.db, "outsider-1");
  await seedTrip(testDb.db, "trip-1", "Trip");
  await seedGroup(testDb.db, "group-1", "trip-1", "Alpha", "admin-1", "1111");
  await seedGroup(testDb.db, "group-2", "trip-1", "Beta", "admin-1", "2222");
  await seedParticipant(testDb.db, "participant-1", "member-1", "trip-1", "group-1");
  await seedParticipant(testDb.db, "participant-2", "outsider-1", "trip-1", "group-2");

  await testDb.db.update(groups).set({ coins: 100 }).where(eq(groups.id, "group-1"));
});

afterAll(async () => {
  await testDb.cleanup();
});

const adminContext = () => ({ db: testDb.db, dbUser: { id: "admin-1" } });

const groupAdminContext = () => ({
  db: testDb.db,
  supabase: createMockSupabase() as never,
  dbUser: { id: "admin-1", role: "ADMIN" },
});

describe("coin mutations — notifications (PGLite)", () => {
  it("notifies the group when an admin adds coins", async () => {
    await addCoins(adminContext(), {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 25,
      reason: "Great job",
    });

    const notifications = await testDb.db.query.notifications.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toContain("Alpha");
    expect(notifications[0]?.body).toContain("25");
    expect(notifications[0]?.body).toContain("Great job");
    expect(notifications[0]?.url).toBe("/trips/groups");

    expect(sendMobileNotificationsMock).toHaveBeenCalledWith(testDb.db, notifications[0]?.id);
  });

  it("addresses only the group that received the coins", async () => {
    await addCoins(adminContext(), {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 25,
    });

    const pushes = await testDb.db.query.notificationPushes.findMany();
    expect(pushes.map((push) => push.targetUserId)).toEqual(["member-1"]);
  });

  it("notifies the group when an admin removes coins", async () => {
    await removeCoins(adminContext(), {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 10,
      reason: "Penalty",
    });

    const notifications = await testDb.db.query.notifications.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toContain("Coins Seized");
    expect(notifications[0]?.body).toContain("Penalty");

    expect(sendMobileNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("still commits the coin change when the push fails", async () => {
    sendMobileNotificationsMock.mockRejectedValueOnce(new Error("expo unreachable"));

    const transaction = await addCoins(adminContext(), {
      tripId: "trip-1",
      groupId: "group-1",
      amount: 40,
    });

    expect(transaction.amount).toBe(40);
    const group = await testDb.db.query.groups.findFirst({
      where: (g, { eq }) => eq(g.id, "group-1"),
    });
    expect(group?.coins).toBe(140);
  });

  it("does not notify when the transaction is rejected", async () => {
    await expect(
      removeCoins(adminContext(), {
        tripId: "trip-1",
        groupId: "group-1",
        amount: 500,
      }),
    ).rejects.toThrow();

    expect(await testDb.db.query.notifications.findMany()).toHaveLength(0);
    expect(sendMobileNotificationsMock).not.toHaveBeenCalled();
  });
});

/**
 * `group.addCoins` — not `coin.addCoins` — is the endpoint the admin app calls
 * (apps/native/src/hooks/admin/useAdminCoins.ts), and a removal reaches it as a
 * negative amount. These are the cases that decide whether issue #12 is fixed
 * in production.
 */
describe("group.addCoins — notifications (PGLite)", () => {
  it("notifies the group when an admin adds coins", async () => {
    await adjustCoinsViaGroup(groupAdminContext(), {
      groupId: "group-1",
      tripId: "trip-1",
      amount: 25,
      reason: "Great job",
    });

    const notifications = await testDb.db.query.notifications.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toContain("Alpha");
    expect(notifications[0]?.body).toContain("25");
    expect(notifications[0]?.body).toContain("Great job");
    expect(notifications[0]?.url).toBe("/trips/groups");

    const pushes = await testDb.db.query.notificationPushes.findMany();
    expect(pushes.map((push) => push.targetUserId)).toEqual(["member-1"]);
    expect(sendMobileNotificationsMock).toHaveBeenCalledWith(testDb.db, notifications[0]?.id);
  });

  it("notifies the group when an admin removes coins via a negative amount", async () => {
    await adjustCoinsViaGroup(groupAdminContext(), {
      groupId: "group-1",
      tripId: "trip-1",
      amount: -10,
      reason: "Penalty",
    });

    const notifications = await testDb.db.query.notifications.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toContain("Coins Seized");
    // The magnitude, not the signed amount: "-10 coins" reads as a bug.
    expect(notifications[0]?.body).toContain("10");
    expect(notifications[0]?.body).not.toContain("-10");
    expect(notifications[0]?.body).toContain("Penalty");
    expect(sendMobileNotificationsMock).toHaveBeenCalledTimes(1);
  });

  it("records the reason on the coin transaction instead of discarding it", async () => {
    await adjustCoinsViaGroup(groupAdminContext(), {
      groupId: "group-1",
      tripId: "trip-1",
      amount: 5,
      reason: "Treasure hunt",
    });

    const transactions = await testDb.db.query.coinTransactions.findMany();
    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.reason).toBe("Treasure hunt");
  });

  it("does not notify when the group does not belong to the trip", async () => {
    await expect(
      adjustCoinsViaGroup(groupAdminContext(), {
        groupId: "group-1",
        tripId: "trip-missing",
        amount: 25,
      }),
    ).rejects.toThrow();

    expect(await testDb.db.query.notifications.findMany()).toHaveLength(0);
    expect(sendMobileNotificationsMock).not.toHaveBeenCalled();
  });

  it("still commits the coin change when the push fails", async () => {
    sendMobileNotificationsMock.mockRejectedValueOnce(new Error("expo unreachable"));

    await adjustCoinsViaGroup(groupAdminContext(), {
      groupId: "group-1",
      tripId: "trip-1",
      amount: 40,
    });

    const group = await testDb.db.query.groups.findFirst({
      where: (g, { eq }) => eq(g.id, "group-1"),
    });
    expect(group?.coins).toBe(140);
  });
});
