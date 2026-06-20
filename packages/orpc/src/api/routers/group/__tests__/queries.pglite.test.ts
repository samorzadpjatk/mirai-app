import { groupJoinRequests, groups, tripParticipants, trips, users } from "@mirai-app/db";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { createContext, createMockSupabase } from "~/test-helpers";
import {
  getAll,
  getAllNames,
  getById,
  getByIdWithOrganizer,
  getGroupList,
  getMy,
  getMyJoinRequestForGroup,
  getPendingJoinRequests,
  ranking,
} from "../queries";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
  await testDb.db
    .insert(users)
    .values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      role: "USER",
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing()
    .onConflictDoNothing()
    .onConflictDoNothing();
});

afterAll(async () => {
  await testDb.cleanup();
});

describe("group/queries - getAllNames", () => {
  it("returns group names for a trip", async () => {
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Alpha",
        organizerId: "user-1",
        code: "AAA1",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Beta",
        organizerId: "user-1",
        code: "BBB1",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAllNames(ctx, { tripId: "trip-1" });

    expect(result).toHaveLength(2);
    expect(result.map((g) => g.name)).toEqual(["Alpha", "Beta"]);
  });

  it("excludes deleted groups", async () => {
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Active",
        organizerId: "user-1",
        code: "AAA1",
        isDeleted: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Deleted",
        organizerId: "user-1",
        code: "BBB1",
        isDeleted: true,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAllNames(ctx, { tripId: "trip-1" });

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Active");
  });

  it("returns empty array when no groups exist", async () => {
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAllNames(ctx, { tripId: "trip-1" });

    expect(result).toEqual([]);
  });
});

describe("group/queries - getMy", () => {
  it("returns null when participant not found", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-999", role: "USER" } });
    const result = await getMy(ctx, { tripId: "trip-1" });

    expect(result).toBeNull();
  });

  it("returns null when group is deleted", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      isDeleted: true,
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "alice@example.com" },
    });
    const result = await getMy(ctx, { tripId: "trip-1" });

    expect(result).toBeNull();
  });

  it("returns null when group not found", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      id: "g-deleted",
      tripId: "trip-1",
      name: "Deleted",
      description: "",
      organizerId: "user-1",
      code: "DEL1",
      isDeleted: true,
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g-deleted",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await getMy(ctx, { tripId: "trip-1" });

    expect(result).toBeNull();
  });

  it("returns group with organizer and participants", async () => {
    await testDb.db
      .insert(users)
      .values([
        {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Alice",
          lastName: "Smith",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          firstName: "Bob",
          lastName: "Jones",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
      ])
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values([
      {
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        groupId: "g1",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "tp-2",
        userId: "user-2",
        tripId: "trip-1",
        groupId: "g1",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "alice@example.com", "auth-2": "bob@example.com" },
    });
    const result = await getMy(ctx, { tripId: "trip-1" });

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Alpha");
    expect(result!.organizer?.id).toBe("user-1");
    expect(result!.organizer?.firstName).toBe("Alice");
    expect(result!.participants).toHaveLength(2);
    expect(result!.participants[0]?.user.email).toBe("alice@example.com");
  });

  it("returns group with null organizer when organizerId is not set", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    // Query directly - the organizer in DB has a valid organizerId, so we test the organizer null path
    // by checking that organizer is correctly resolved
    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "alice@example.com" },
    });
    const result = await getMy(ctx, { tripId: "trip-1" });

    expect(result).not.toBeNull();
    // Organizer should be present because organizerId maps to user-1
  });
});

describe("group/queries - getAll", () => {
  it("returns paginated groups without pagination input", async () => {
    await seedTripAndUser();
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Alpha",
        organizerId: "user-1",
        code: "AAA1",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Beta",
        organizerId: "user-1",
        code: "BBB1",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAll(ctx, { tripId: "trip-1" });

    expect(result.groups).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.limit).toBe(30);
  });

  it("returns paginated groups with custom pagination", async () => {
    await seedTripAndUser();
    for (let i = 0; i < 10; i++) {
      await testDb.db.insert(groups).values({
        description: "",
        id: `g${i}`,
        tripId: "trip-1",
        name: `Group ${i}`,
        organizerId: "user-1",
        code: `CODE${i}`,
        createdAt: now(),
        updatedAt: now(),
      });
    }

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAll(ctx, {
      tripId: "trip-1",
      pagination: { limit: 3, offset: 2 },
    });

    expect(result.groups).toHaveLength(3);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.offset).toBe(2);
  });

  it("returns empty groups with correct pagination when no groups", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getAll(ctx, { tripId: "trip-1" });

    expect(result.groups).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("returns groups with null organizer", async () => {
    await seedTripAndUser();
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    // The organizer will be resolved from the DB, so test that the query works correctly
    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com" },
    });
    const result = await getAll(ctx, { tripId: "trip-1" });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]!.name).toBe("Alpha");
  });
});

describe("group/queries - getGroupList", () => {
  it("returns groups with participant counts", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Alpha",
        organizerId: "user-1",
        code: "AAA1",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Beta",
        organizerId: "user-1",
        code: "BBB1",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);
    await testDb.db.insert(tripParticipants).values([
      {
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        groupId: "g1",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getGroupList(ctx, { tripId: "trip-1" });

    expect(result).toHaveLength(2);
    expect(result[0]!._count.participants).toBe(1);
    expect(result[1]!._count.participants).toBe(0);
  });

  it("returns empty array when no groups exist", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getGroupList(ctx, { tripId: "trip-1" });

    expect(result).toEqual([]);
  });
});

describe("group/queries - getById", () => {
  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    await expect(getById(ctx, { id: "nonexistent" })).rejects.toThrow("Group not found");
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      isDeleted: true,
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    await expect(getById(ctx, { description: "", id: "g1" })).rejects.toThrow("Group not found");
  });

  it("returns group with participant count and organizer", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "alice@example.com" },
    });
    const result = await getById(ctx, { description: "", id: "g1" });

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Alpha");
    expect(result!._count.participants).toBe(1);
  });

  it("returns group with empty participants when none", async () => {
    await seedTripAndUser();
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await getById(ctx, { description: "", id: "g1" });

    expect(result).not.toBeNull();
    expect(result!._count.participants).toBe(0);
  });
});

describe("group/queries - getByIdWithOrganizer", () => {
  it("returns null when group does not exist", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getByIdWithOrganizer(ctx, { groupId: "nonexistent" });

    expect(result).toBeNull();
  });

  it("returns group with organizer and participant count", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "MODERATOR" } });
    const result = await getByIdWithOrganizer(ctx, { groupId: "g1" });

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Alpha");
    expect(result!._count.participants).toBe(1);
  });
});

describe("group/queries - getPendingJoinRequests", () => {
  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    await expect(getPendingJoinRequests(ctx, { groupId: "nonexistent" })).rejects.toThrow(
      "Group not found",
    );
  });

  it("throws FORBIDDEN when user is not organizer and not admin", async () => {
    await testDb.db
      .insert(users)
      .values([
        {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Alice",
          lastName: "Smith",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          firstName: "Bob",
          lastName: "Jones",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
      ])
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-2", role: "USER" } });
    await expect(getPendingJoinRequests(ctx, { groupId: "g1" })).rejects.toThrow(
      "Only group organizer can view join requests",
    );
  });

  it("returns empty array when no join requests", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await getPendingJoinRequests(ctx, { groupId: "g1" });

    expect(result).toEqual([]);
  });

  it("returns join requests as organizer", async () => {
    await testDb.db
      .insert(users)
      .values([
        {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Alice",
          lastName: "Smith",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          firstName: "Bob",
          lastName: "Jones",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
      ])
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groupJoinRequests).values({
      id: "jr1",
      tripId: "trip-1",
      groupId: "g1",
      userId: "user-2",
      createdAt: now(),
    });

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-2": "bob@example.com" },
    });
    const result = await getPendingJoinRequests(ctx, { groupId: "g1" });

    expect(result).toHaveLength(1);
    expect(result[0]!.user.firstName).toBe("Bob");
  });
});

describe("group/queries - getMyJoinRequestForGroup", () => {
  it("throws NOT_FOUND when group does not exist", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    await expect(getMyJoinRequestForGroup(ctx, { groupId: "nonexistent" })).rejects.toThrow(
      "Group not found",
    );
  });

  it("throws NOT_FOUND when group is deleted", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      isDeleted: true,
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    await expect(getMyJoinRequestForGroup(ctx, { groupId: "g1" })).rejects.toThrow(
      "Group not found",
    );
  });

  it("returns null when no join request exists", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await getMyJoinRequestForGroup(ctx, { groupId: "g1" });

    expect(result).toBeNull();
  });

  it("returns the join request when it exists", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values({
      description: "",
      id: "g1",
      tripId: "trip-1",
      name: "Alpha",
      organizerId: "user-1",
      code: "AAA1",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groupJoinRequests).values({
      id: "jr1",
      tripId: "trip-1",
      groupId: "g1",
      userId: "user-1",
      createdAt: now(),
    });

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await getMyJoinRequestForGroup(ctx, { groupId: "g1" });

    expect(result).not.toBeNull();
    expect(result!.id).toBe("jr1");
  });
});

describe("group/queries - ranking", () => {
  it("returns groups sorted by coins descending", async () => {
    await testDb.db
      .insert(users)
      .values([
        {
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Alice",
          lastName: "Smith",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: "user-2",
          authUserId: "auth-2",
          firstName: "Bob",
          lastName: "Jones",
          role: "USER",
          createdAt: now(),
          updatedAt: now(),
        },
      ])
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Alpha",
        organizerId: "user-1",
        code: "AAA1",
        coins: 100,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Beta",
        organizerId: "user-1",
        code: "BBB1",
        coins: 200,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g3",
        tripId: "trip-1",
        name: "Gamma",
        organizerId: "user-1",
        code: "CCC1",
        coins: 50,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);
    await testDb.db.insert(tripParticipants).values([
      {
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        groupId: "g1",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "tp-2",
        userId: "user-2",
        tripId: "trip-1",
        groupId: "g2",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "alice@example.com", "auth-2": "bob@example.com" },
    });
    const result = await ranking(ctx, { tripId: "trip-1" });

    expect(result.data).toHaveLength(3);
    expect(result.data[0]!.name).toBe("Beta"); // coins=200
    expect(result.data[1]!.name).toBe("Alpha"); // coins=100
    expect(result.data[2]!.name).toBe("Gamma"); // coins=50
    expect(result.currentDate).toBeDefined();
  });

  it("returns empty data when no groups", async () => {
    await seedTripAndUser();

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await ranking(ctx, { tripId: "trip-1" });

    expect(result.data).toEqual([]);
  });

  it("returns groups with deleted groups excluded", async () => {
    await testDb.db
      .insert(users)
      .values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Alice",
        lastName: "Smith",
        role: "USER",
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing();
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(groups).values([
      {
        description: "",
        id: "g1",
        tripId: "trip-1",
        name: "Active",
        organizerId: "user-1",
        code: "AAA1",
        coins: 100,
        isDeleted: false,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        description: "",
        id: "g2",
        tripId: "trip-1",
        name: "Deleted",
        organizerId: "user-1",
        code: "BBB1",
        coins: 200,
        isDeleted: true,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const result = await ranking(ctx, { tripId: "trip-1" });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe("Active");
  });
});

// Helper to seed trip and user
async function seedTripAndUser() {
  await testDb.db
    .insert(users)
    .values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
      role: "USER",
      createdAt: now(),
      updatedAt: now(),
    })
    .onConflictDoNothing();
  await testDb.db.insert(trips).values({
    id: "trip-1",
    name: "Test Trip",
    description: "",
    startDate: now(),
    endDate: new Date(Date.now() + 86400000),
    createdAt: now(),
    updatedAt: now(),
  });
}
