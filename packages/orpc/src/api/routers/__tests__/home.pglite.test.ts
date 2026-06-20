import { notificationPushes, notifications } from "@mirai-app/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createMockSupabase,
  seedGroup,
  seedParticipant,
  seedTrip,
  seedUser,
} from "../../../test-helpers";
import { getHomeFull } from "../home/queries";

const TEST_USER_ID = "user-1";
const TEST_TRIP_ID = "trip-1";

describe("home.getHomeFull — PGLite integration", () => {
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

  async function seedNotification(notificationId: string, createdById = TEST_USER_ID) {
    await testDb.db.insert(notifications).values({
      id: notificationId,
      title: "Test notification",
      body: "This is a test notification",
      url: "/home",
      createdById,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedNotificationPush(
    notificationId: string,
    targetUserId: string,
    status: string,
  ) {
    await testDb.db.insert(notificationPushes).values({
      notificationId,
      targetUserId,
      status,
      sentAt: status === "sent" ? now() : null,
    });
  }

  function buildContext(
    userId = TEST_USER_ID,
    emails: Record<string, string> = {},
    db: (typeof testDb)["db"] = testDb.db,
  ) {
    return {
      db,
      supabase: createMockSupabase(emails),
      accessToken: "test-token",
      dbUser: { id: userId, role: "USER" as const },
    };
  }

  it("returns user, trips and unread notification count", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Home Trip");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Team A", TEST_USER_ID, "TEAM01");
    await seedParticipant(testDb.db, "tp-1", TEST_USER_ID, TEST_TRIP_ID, "group-1");
    await seedNotification("notif-1");
    await seedNotificationPush("notif-1", TEST_USER_ID, "pending");

    const result = await getHomeFull(
      buildContext(TEST_USER_ID, { "auth-1": "alice@example.com" }),
      {},
    );

    expect(result.user?.id).toBe(TEST_USER_ID);
    expect(result.user?.firstName).toBe("Alice");
    expect(result.user?.email).toBe("alice@example.com");

    expect(result.trips.trips).toHaveLength(1);
    expect(result.trips.trips[0]?.id).toBe(TEST_TRIP_ID);
    expect(result.trips.trips[0]?.name).toBe("Home Trip");

    expect(result.notifications.unreadCount).toBe(1);
  });

  it("returns empty trips and zero unread count for new user", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");

    const result = await getHomeFull(buildContext(TEST_USER_ID), {});

    expect(result.user?.id).toBe(TEST_USER_ID);
    expect(result.trips.trips).toHaveLength(0);
    expect(result.notifications.unreadCount).toBe(0);
  });

  it("only counts pending notifications as unread", async () => {
    await seedUser(testDb.db, TEST_USER_ID, "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Home Trip");
    await seedParticipant(testDb.db, "tp-1", TEST_USER_ID, TEST_TRIP_ID);
    await seedNotification("notif-1");
    await seedNotificationPush("notif-1", TEST_USER_ID, "pending");
    await seedNotification("notif-2");
    await seedNotificationPush("notif-2", TEST_USER_ID, "sent");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedNotification("notif-3");
    await seedNotificationPush("notif-3", "user-2", "pending");

    const result = await getHomeFull(buildContext(TEST_USER_ID), {});

    expect(result.trips.trips).toHaveLength(1);
    expect(result.notifications.unreadCount).toBe(1);
  });

  it("returns null user when user does not exist", async () => {
    const result = await getHomeFull(buildContext("nonexistent-user"), {});

    expect(result.user).toBeNull();
    expect(result.trips.trips).toHaveLength(0);
    expect(result.notifications.unreadCount).toBe(0);
  });
});
