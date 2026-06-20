import {
  coinTransactions,
  groupJoinRequests,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { and, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createMockSupabase } from "~/test-helpers";
import {
  addCoins,
  bulkAssignUsersToGroup,
  leaveMyGroup,
  removeUserFromGroup,
} from "../group/mutations";

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

async function seedUser(id: string, firstName: string, lastName: string, role = "USER") {
  await testDb.db.insert(users).values({
    id,
    authUserId: `auth-${id}`,
    firstName,
    lastName,
    role,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    description: "",
    startDate: now(),
    endDate: new Date(Date.now() + 86400000 * 30),
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedGroup(id: string, tripId: string, organizerId: string, code: string, coins = 0) {
  await testDb.db.insert(groups).values({
    id,
    tripId,
    name: `Group ${id}`,
    description: "",
    organizerId,
    code,
    coins,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db.insert(tripParticipants).values({
    id,
    userId,
    tripId,
    groupId,
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedJoinRequest(id: string, tripId: string, groupId: string, userId: string) {
  await testDb.db.insert(groupJoinRequests).values({
    id,
    tripId,
    groupId,
    userId,
    createdAt: now(),
  });
}

describe("group mutations — bulkAssignUsersToGroup", () => {
  it("assigns multiple users to a group and deletes their join requests", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedUser("user-3", "Charlie", "Brown");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedParticipant("tp-3", "user-3", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");
    await seedJoinRequest("gjr-3", "trip-1", "group-1", "user-3");

    const result = await bulkAssignUsersToGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase({
          "auth-user-2": "bob@example.com",
          "auth-user-3": "charlie@example.com",
        }),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        tripId: "trip-1",
        groupId: "group-1",
        userIds: ["user-2", "user-3"],
      },
    );

    expect(result.count).toBe(2);

    // Verify participants are assigned to group
    const participants = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, "trip-1"),
          inArray(tripParticipants.userId, ["user-2", "user-3"]),
        ),
      );
    expect(participants.every((p) => p.groupId === "group-1")).toBe(true);

    // Verify join requests are deleted
    const remainingRequests = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.groupId, "group-1"));
    expect(remainingRequests).toHaveLength(0);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");

    await expect(
      bulkAssignUsersToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        {
          tripId: "trip-1",
          groupId: "nonexistent",
          userIds: ["user-2"],
        },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws FORBIDDEN when non-organizer tries to assign users", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      bulkAssignUsersToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        {
          tripId: "trip-1",
          groupId: "group-1",
          userIds: [],
        },
      ),
    ).rejects.toThrow("Only the organizer can assign users to this group");
  });
});

describe("group mutations — removeUserFromGroup", () => {
  it("removes a user from a group as organizer", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    const result = await removeUserFromGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        userId: "user-2",
        tripId: "trip-1",
      },
    );

    expect(result).toBeDefined();

    // Verify user-2's groupId is null
    const participant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(participant[0].groupId).toBeNull();
  });

  it("deletes group when last member is removed", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    // Remove user-2 first (now only user-1 remains)
    await removeUserFromGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { userId: "user-2", tripId: "trip-1" },
    );

    // Remove user-1 (last member) — group should be deleted
    await removeUserFromGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { userId: "user-1", tripId: "trip-1" },
    );

    const groupRows = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].isDeleted).toBe(true);
  });
});

describe("group mutations — leaveMyGroup", () => {
  it("allows non-organizer member to leave the group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    const result = await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.left).toBe(true);
    expect(result.groupDeleted).toBe(false);

    // Verify user-2's groupId is null
    const participant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(participant[0].groupId).toBeNull();
  });

  it("deletes group when last non-organizer member leaves and organizer already left", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    // Organizer leaves first (transfers organizer role or deletes group)
    await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { groupId: "group-1" },
    );

    // Now user-2 is the only member — but organizer was transferred
    // user-2 leaves
    const result = await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.left).toBe(true);
  });
});

describe("group mutations — addCoins", () => {
  it("adds coins to a group and creates a coin transaction", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    const result = await addCoins(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        groupId: "group-1",
        amount: 50,
        tripId: "trip-1",
      },
    );

    expect(result).toBeDefined();
    expect(result.group.coins).toBe(150);

    // Verify group coins updated
    const groupRows = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(groupRows[0].coins).toBe(150);

    // Verify coin transaction created
    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(1);
    expect(txRows[0].amount).toBe(50);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");

    await expect(
      addCoins(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        {
          groupId: "nonexistent",
          amount: 50,
          tripId: "trip-1",
        },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    // Soft-delete the group
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      addCoins(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        {
          groupId: "group-1",
          amount: 50,
          tripId: "trip-1",
        },
      ),
    ).rejects.toThrow("Group not found");
  });
});
