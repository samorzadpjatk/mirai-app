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
  assignUserToGroup,
  bulkAssignUsersToGroup,
  cancelMyJoinRequest,
  create,
  deleteGroup,
  deleteMyGroup,
  join,
  leaveMyGroup,
  removeUserFromGroup,
  requestToJoin,
  respondToJoinRequest,
  update,
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

describe("group mutations — create", () => {
  it("creates a group with default organizer and adds creator as participant", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    const result = await create(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-1": "alice@example.com" }),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        tripId: "trip-1",
        name: "My Group",
        description: "A test group",
      },
    );

    expect(result.name).toBe("My Group");
    expect(result.code).toMatch(/^\d{4}$/);
    expect(result.organizer).toEqual(
      expect.objectContaining({ id: "user-1", email: "alice@example.com" }),
    );

    // Creator should be added as participant
    const participant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(and(eq(tripParticipants.userId, "user-1"), eq(tripParticipants.tripId, "trip-1")));
    expect(participant[0].groupId).toBe(result.id);
  });

  it("creates a group with explicit organizerId and no description", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");

    const result = await create(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-2": "bob@example.com" }),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        tripId: "trip-1",
        name: "Organizer Group",
        organizerId: "user-2",
      },
    );

    expect(result.organizerId).toBe("user-2");
    expect(result.organizer).toEqual(
      expect.objectContaining({ id: "user-2", email: "bob@example.com" }),
    );
  });

  it("deletes existing join request when creator creates a group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-existing", "trip-1", "user-1", "1111");
    await seedJoinRequest("gjr-1", "trip-1", "group-existing", "user-1");

    const result = await create(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        tripId: "trip-1",
        name: "New Group",
      },
    );

    expect(result.name).toBe("New Group");

    // Join request should be deleted
    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.userId, "user-1"));
    expect(remaining).toHaveLength(0);
  });
});

describe("group mutations — update", () => {
  it("updates group name as organizer", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    const result = await update(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-1": "alice@example.com" }),
        dbUser: { id: "user-1", role: "USER" },
      },
      {
        id: "group-1",
        tripId: "trip-1",
        name: "Updated Name",
      },
    );

    expect(result?.name).toBe("Updated Name");
  });

  it("allows admin to change organizer", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    const result = await update(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        id: "group-1",
        tripId: "trip-1",
        organizerId: "user-2",
      },
    );

    expect(result?.organizerId).toBe("user-2");
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      update(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "nonexistent",
          tripId: "trip-1",
          name: "New Name",
        },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      update(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "group-1",
          tripId: "trip-1",
          name: "New Name",
        },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when tripId does not match group's trip", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Other Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      update(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "group-1",
          tripId: "trip-2",
          name: "New Name",
        },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws FORBIDDEN when non-organizer non-admin tries to update", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      update(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        {
          id: "group-1",
          tripId: "trip-1",
          name: "Hacked Name",
        },
      ),
    ).rejects.toThrow("Only group organizer or admin can update this group");
  });

  it("throws FORBIDDEN when non-admin tries to change organizer", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      update(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        {
          id: "group-1",
          tripId: "trip-1",
          organizerId: "user-2",
        },
      ),
    ).rejects.toThrow("Only admin can change group organizer");
  });
});

describe("group mutations — deleteGroup", () => {
  it("soft-deletes a group and clears participants", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");

    const result = await deleteGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { id: "group-1" },
    );

    expect(result.success).toBe(true);

    const groupRows = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].isDeleted).toBe(true);

    const participant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(participant[0].groupId).toBeNull();
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");

    await expect(
      deleteGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { id: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is already deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      deleteGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { id: "group-1" },
      ),
    ).rejects.toThrow("Group not found");
  });
});

describe("group mutations — deleteMyGroup", () => {
  it("deletes group as organizer", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");

    const result = await deleteMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.success).toBe(true);

    const groupRows = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].isDeleted).toBe(true);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      deleteMyGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { groupId: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws FORBIDDEN when non-organizer tries to delete", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      deleteMyGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("Only group organizer can delete this group");
  });
});

describe("group mutations — join", () => {
  it("joins a group successfully", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    const result = await join(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { id: "group-1", tripId: "trip-1" },
    );

    expect(result).toBeDefined();
    expect(result.groupId).toBe("group-1");

    // Join request should be deleted
    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.userId, "user-2"));
    expect(remaining).toHaveLength(0);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      join(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { id: "nonexistent", tripId: "trip-1" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws BAD_REQUEST when group is not in the specified trip", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Other Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      join(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { id: "group-1", tripId: "trip-2" },
      ),
    ).rejects.toThrow("Group not in trip");
  });

  it("throws BAD_REQUEST when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      join(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { id: "group-1", tripId: "trip-1" },
      ),
    ).rejects.toThrow("Group not in trip");
  });

  it("throws CONFLICT when user is already in the group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    await expect(
      join(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { id: "group-1", tripId: "trip-1" },
      ),
    ).rejects.toThrow("już należy do tej grupy");
  });
});

describe("group mutations — requestToJoin", () => {
  it("creates a join request successfully", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const result = await requestToJoin(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result).toBeDefined();
    expect(result.groupId).toBe("group-1");
    expect(result.userId).toBe("user-2");
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      requestToJoin(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { groupId: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws FORBIDDEN when user is not a trip participant", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      requestToJoin(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("Only trip participants can request joining a group");
  });

  it("throws BAD_REQUEST when user is already in a group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedGroup("group-2", "trip-1", "user-1", "5678");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-2");

    await expect(
      requestToJoin(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("You are already in a group");
  });

  it("throws CONFLICT when user already has a pending request for the same group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    await expect(
      requestToJoin(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("Join request for this group is already pending");
  });

  it("throws CONFLICT when user already has a pending request for another group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedGroup("group-2", "trip-1", "user-1", "5678");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-2", "user-2");

    await expect(
      requestToJoin(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("You already have a pending request for another group");
  });
});

describe("group mutations — cancelMyJoinRequest", () => {
  it("cancels a pending join request", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    const result = await cancelMyJoinRequest(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.success).toBe(true);

    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.id, "gjr-2"));
    expect(remaining).toHaveLength(0);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      cancelMyJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { groupId: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when join request does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      cancelMyJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("Join request not found");
  });
});

describe("group mutations — respondToJoinRequest", () => {
  it("accepts a join request and assigns user to group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    const result = await respondToJoinRequest(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { requestId: "gjr-2", decision: "ACCEPT" },
    );

    expect(result.status).toBe("ACCEPTED");

    // Participant should be assigned to group
    const participant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(participant[0].groupId).toBe("group-1");

    // Join request should be deleted
    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.id, "gjr-2"));
    expect(remaining).toHaveLength(0);
  });

  it("rejects a join request and deletes it", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    const result = await respondToJoinRequest(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { requestId: "gjr-2", decision: "REJECT" },
    );

    expect(result.status).toBe("REJECTED");

    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.id, "gjr-2"));
    expect(remaining).toHaveLength(0);
  });

  it("throws NOT_FOUND when request does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      respondToJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { requestId: "nonexistent", decision: "ACCEPT" },
      ),
    ).rejects.toThrow("Join request not found");
  });

  it("throws FORBIDDEN when non-organizer tries to respond", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    await expect(
      respondToJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { requestId: "gjr-2", decision: "ACCEPT" },
      ),
    ).rejects.toThrow("Only group organizer can view join requests");
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      respondToJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { requestId: "gjr-2", decision: "ACCEPT" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws BAD_REQUEST when user is not a trip participant", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    await expect(
      respondToJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { requestId: "gjr-2", decision: "ACCEPT" },
      ),
    ).rejects.toThrow("User is not a participant of this trip");
  });

  it("throws BAD_REQUEST when user is already in another group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedGroup("group-2", "trip-1", "user-1", "5678");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-2");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    await expect(
      respondToJoinRequest(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { requestId: "gjr-2", decision: "ACCEPT" },
      ),
    ).rejects.toThrow("User is already in another group");
  });
});

describe("group mutations — assignUserToGroup", () => {
  it("assigns a user to a group successfully", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");

    const result = await assignUserToGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { userId: "user-2", tripId: "trip-1", groupId: "group-1" },
    );

    expect(result).toBeDefined();
    expect(result.groupId).toBe("group-1");

    // Join request should be deleted
    const remaining = await testDb.db
      .select()
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.userId, "user-2"));
    expect(remaining).toHaveLength(0);
  });

  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");

    await expect(
      assignUserToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { userId: "user-2", tripId: "trip-1", groupId: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws BAD_REQUEST when group is not in the specified trip", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Other Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      assignUserToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { userId: "user-2", tripId: "trip-2", groupId: "group-1" },
      ),
    ).rejects.toThrow("Group not in trip");
  });

  it("throws BAD_REQUEST when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      assignUserToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { userId: "user-2", tripId: "trip-1", groupId: "group-1" },
      ),
    ).rejects.toThrow("Group not in trip");
  });

  it("throws CONFLICT when user is already in the group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    await expect(
      assignUserToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { userId: "user-2", tripId: "trip-1", groupId: "group-1" },
      ),
    ).rejects.toThrow("już należy do tej grupy");
  });
});

describe("group mutations — removeUserFromGroup (additional branches)", () => {
  it("throws NOT_FOUND when participant does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");

    await expect(
      removeUserFromGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        { userId: "nonexistent", tripId: "trip-1" },
      ),
    ).rejects.toThrow("Participant not found");
  });

  it("removes a participant who has no group (groupId is null)", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const result = await removeUserFromGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { userId: "user-2", tripId: "trip-1" },
    );

    expect(result).toBeDefined();
  });

  it("transfers organizer role when organizer is removed and members remain", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    // Remove the organizer (user-1) — should transfer to user-2
    await removeUserFromGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      { userId: "user-1", tripId: "trip-1" },
    );

    const groupRows = await testDb.db
      .select({ organizerId: groups.organizerId })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].organizerId).toBe("user-2");
  });
});

describe("group mutations — leaveMyGroup (additional branches)", () => {
  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");

    await expect(
      leaveMyGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { groupId: "nonexistent" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await testDb.db.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

    await expect(
      leaveMyGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("Group not found");
  });

  it("throws FORBIDDEN when user is not a member of the group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");

    await expect(
      leaveMyGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-2", role: "USER" },
        },
        { groupId: "group-1" },
      ),
    ).rejects.toThrow("You are not a member of this group");
  });

  it("organizer leaves with remaining members — transfers organizer role", async () => {
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
        dbUser: { id: "user-1", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.left).toBe(true);
    expect(result.reassignedOrganizerId).toBe("user-2");

    // Group should NOT be deleted since members remain
    const groupRows = await testDb.db
      .select({ isDeleted: groups.isDeleted, organizerId: groups.organizerId })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].isDeleted).toBe(false);
    expect(groupRows[0].organizerId).toBe("user-2");
  });

  it("organizer leaves as last member — deletes group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");

    const result = await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.left).toBe(true);
    expect(result.groupDeleted).toBe(true);

    const groupRows = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(groupRows[0].isDeleted).toBe(true);
  });

  it("non-organizer leaves as last member — deletes group", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    // Organizer leaves first (transfers to user-2)
    await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-1", role: "USER" },
      },
      { groupId: "group-1" },
    );

    // user-2 (now organizer) leaves as last member
    const result = await leaveMyGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase(),
        dbUser: { id: "user-2", role: "USER" },
      },
      { groupId: "group-1" },
    );

    expect(result.left).toBe(true);
    expect(result.groupDeleted).toBe(true);
  });
});

describe("group mutations — bulkAssignUsersToGroup (additional branches)", () => {
  it("deduplicates user IDs before assigning", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const result = await bulkAssignUsersToGroup(
      {
        db: testDb.db,
        supabase: createMockSupabase({ "auth-user-2": "bob@example.com" }),
        dbUser: { id: "user-1", role: "ADMIN" },
      },
      {
        tripId: "trip-1",
        groupId: "group-1",
        userIds: ["user-2", "user-2", "user-2"],
      },
    );

    expect(result.count).toBe(1);
  });

  it("throws NOT_FOUND when group tripId does not match", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Other Trip");
    await seedUser("user-1", "Alice", "Smith", "ADMIN");
    await seedGroup("group-1", "trip-1", "user-1", "1234");

    await expect(
      bulkAssignUsersToGroup(
        {
          db: testDb.db,
          supabase: createMockSupabase(),
          dbUser: { id: "user-1", role: "ADMIN" },
        },
        {
          tripId: "trip-2",
          groupId: "group-1",
          userIds: ["user-2"],
        },
      ),
    ).rejects.toThrow("Group not found");
  });
});

describe("group mutations — addCoins (additional coverage)", () => {
  it("adds coins to a group with existing coins", async () => {
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

    expect(result.group.coins).toBe(150);

    const txRows = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txRows).toHaveLength(1);
    expect(txRows[0].amount).toBe(50);
  });
});
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
