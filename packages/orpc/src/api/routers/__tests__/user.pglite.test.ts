import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { eq, and, count } from "drizzle-orm";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { getById, getTripParticipant, getAll, searchWithPagination } from "../user/queries";
import { createUser, deleteUser, updateWristNumber, banUserUntil } from "../user/mutations";
import { users, tripParticipants, groups, trips } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "auth-1", email: "user@example.com" },
    dbUser: {
      id: "user-1",
      authUserId: "auth-1",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    },
  }),
  requireAdmin: vi.fn().mockResolvedValue({
    id: "admin-1",
    authUserId: "auth-admin",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
  }),
  requireModerator: vi.fn().mockResolvedValue({
    id: "mod-1",
    authUserId: "auth-mod",
    email: "mod@example.com",
    firstName: "Mod",
    lastName: "User",
    role: "MODERATOR",
  }),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));

function createMockSupabase(emails: Record<string, string> = {}) {
  const users: Record<
    string,
    {
      id: string;
      email: string;
      banned_until?: string;
      app_metadata?: Record<string, unknown>;
    }
  > = {};

  for (const [authUserId, email] of Object.entries(emails)) {
    users[authUserId] = { id: authUserId, email };
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        getUserById: vi.fn().mockImplementation(async (id: string) => {
          const user = users[id];
          return {
            data: {
              user: user
                ? {
                    id: user.id,
                    email: user.email,
                    banned_until: user.banned_until,
                    app_metadata: user.app_metadata ?? {},
                  }
                : null,
            },
            error: null,
          };
        }),
        listUsers: vi.fn().mockResolvedValue({
          data: { users: Object.values(users) },
          error: null,
        }),
        createUser: vi.fn().mockImplementation(async ({ email }: { email: string }) => {
          const id = crypto.randomUUID();
          users[id] = { id, email };
          return { data: { user: { id, email } }, error: null };
        }),
        updateUserById: vi.fn().mockImplementation(
          async (
            id: string,
            updates: {
              ban_duration?: string;
              app_metadata?: Record<string, unknown>;
            },
          ) => {
            if (users[id]) {
              users[id] = {
                ...users[id],
                ...updates,
                app_metadata: {
                  ...(users[id].app_metadata ?? {}),
                  ...(updates.app_metadata ?? {}),
                },
              };
            }
            return { data: { user: users[id] }, error: null };
          },
        ),
        deleteUser: vi.fn().mockImplementation(async (id: string) => {
          delete users[id];
          return { data: null, error: null };
        }),
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({
          data: { signedUrl: "https://signed-url.example.com/image.jpg" },
          error: null,
        }),
      }),
    },
  };
}

function createContext(
  testDb: Awaited<ReturnType<typeof createPgliteTestDb>>,
  overrides: Partial<{
    dbUser: { id: string; role: string };
    emails: Record<string, string>;
  }> = {},
) {
  const dbUser = overrides.dbUser ?? { id: "mod-1", role: "MODERATOR" };
  const supabase = createMockSupabase(overrides.emails ?? {});
  return {
    db: testDb.db,
    supabase,
    dbUser,
    accessToken: "test-token",
  };
}

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

describe("raw SQLite transaction rollback", () => {
  it("rolls back createUser transaction on failure", async () => {
    const now = new Date();

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Test",
          lastName: "User",
          role: "USER",
          createdAt: now,
          updatedAt: now,
        });
        await tx.insert(tripParticipants).values({
          id: "tp-1",
          userId: "user-1",
          tripId: "trip-1",
          createdAt: now,
          updatedAt: now,
        });
        throw new Error("Simulated failure after inserts");
      });
    } catch {
      // Expected rollback
    }

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(0);

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(participantResult).toHaveLength(0);
  });

  it("rolls back deleteUser transaction on failure", async () => {
    const now = new Date();

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip 1",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });
    await testDb.db.insert(trips).values({
      id: "trip-2",
      name: "Test Trip 2",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      createdAt: now,
      updatedAt: now,
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      createdAt: now,
      updatedAt: now,
    });
    await testDb.db.insert(tripParticipants).values({
      id: "tp-2",
      userId: "user-1",
      tripId: "trip-2",
      createdAt: now,
      updatedAt: now,
    });

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .delete(tripParticipants)
          .where(and(eq(tripParticipants.userId, "user-1"), eq(tripParticipants.tripId, "trip-1")));
        const remaining = await tx
          .select({ count: count() })
          .from(tripParticipants)
          .where(eq(tripParticipants.userId, "user-1"));
        if (remaining[0].count === 0) {
          await tx.delete(users).where(eq(users.id, "user-1"));
        }
        throw new Error("Simulated failure after delete");
      });
    } catch {
      // Expected rollback
    }

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(1);

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, "user-1"));
    expect(participantResult).toHaveLength(2);
  });

  it("commits createUser transaction successfully", async () => {
    const now = new Date();

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });

    await testDb.db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(tripParticipants).values({
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        createdAt: now,
        updatedAt: now,
      });
    });

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(1);
    expect(userResult[0].firstName).toBe("Test");

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(participantResult).toHaveLength(1);
    expect(participantResult[0].userId).toBe("user-1");
  });
});

describe("Drizzle ORM SQLite integration", () => {
  async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
    await testDb.db.insert(users).values({
      id,
      authUserId,
      firstName,
      lastName,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedGroup(
    id: string,
    tripId: string,
    name: string,
    organizerId: string,
    code: string,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name,
      organizerId,
      code,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedParticipant(
    id: string,
    userId: string,
    tripId: string,
    groupId?: string,
    wristNumber?: string,
    houseNumber?: string,
  ) {
    await testDb.db.insert(tripParticipants).values({
      id,
      userId,
      tripId,
      groupId,
      wristNumber,
      houseNumber,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  it("getById returns user with correct fields", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com" },
    });

    const result = await getById(ctx, { id: "user-1" });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-1");
    expect(result?.firstName).toBe("Alice");
    expect(result?.lastName).toBe("Smith");
    expect(result?.email).toBe("alice@example.com");
  });

  it("getTripParticipant returns participant details", async () => {
    await seedUser("user-1", "auth-1", "Test", "User");
    await seedTrip("trip-1", "Test Trip");
    await seedParticipant("tp-1", "user-1", "trip-1", undefined, "W001", "H101");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
    });
    const result = await getTripParticipant(ctx, {
      userId: "user-1",
      tripId: "trip-1",
    });

    expect(result).not.toBeNull();
    expect(result?.wristNumber).toBe("W001");
    expect(result?.houseNumber).toBe("H101");
    expect(result?.userId).toBe("user-1");
    expect(result?.tripId).toBe("trip-1");
  });

  it("getAll returns all participants with groups", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com", "auth-2": "bob@example.com" },
    });
    const result = await getAll(ctx, { tripId: "trip-1" });

    expect(result).toHaveLength(2);
    expect(result[0]?.firstName).toBe("Alice");
    expect(result[1]?.firstName).toBe("Bob");
    expect(result[0]?.group?.name).toBe("Team A");
    expect(result[1]?.group).toBeNull();
  });

  it("searchWithPagination paginated search with filtering", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedTrip("trip-1", "Test Trip");
    await seedParticipant("tp-1", "user-1", "trip-1");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com", "auth-2": "bob@example.com" },
    });
    const result = await searchWithPagination(ctx, {
      tripId: "trip-1",
      field: "firstName",
      searchTerm: "Ali",
      pagination: { limit: 10, offset: 0 },
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]?.firstName).toBe("Alice");
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("createUser inserts user and participant", async () => {
    await seedTrip("trip-1", "Test Trip");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    const result = await createUser(ctx, {
      tripId: "trip-1",
      firstName: "New",
      lastName: "User",
      email: "new@example.com",
    });

    expect(result).toBeDefined();
    expect(result.tripId).toBe("trip-1");
    expect(result.firstName).toBe("New");
    expect(result.lastName).toBe("User");

    const userResult = await testDb.db.select().from(users).where(eq(users.firstName, "New"));
    expect(userResult).toHaveLength(1);
    expect(userResult[0].firstName).toBe("New");

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.tripId, "trip-1"));
    expect(participantResult).toHaveLength(1);
    expect(participantResult[0].userId).toBe(userResult[0].id);
  });

  it("rolls back createUser-like Drizzle transaction on failure", async () => {
    const now = new Date();

    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(users).values({
          id: "user-1",
          authUserId: "auth-1",
          firstName: "Test",
          lastName: "User",
          role: "USER",
          createdAt: now,
          updatedAt: now,
        });
        await tx.insert(tripParticipants).values({
          id: "tp-1",
          userId: "user-1",
          tripId: "trip-1",
          createdAt: now,
          updatedAt: now,
        });
        throw new Error("Simulated failure");
      });
    } catch {
      // Expected rollback
    }

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(0);

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(participantResult).toHaveLength(0);
  });

  it("deleteUser removes participant and user when no remaining trips", async () => {
    await seedUser("user-1", "auth-1", "Test", "User");
    await seedTrip("trip-1", "Test Trip");
    await seedParticipant("tp-1", "user-1", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await deleteUser(ctx, {
      userId: "user-1",
      tripId: "trip-1",
    });

    expect(result.deletedFromSystem).toBe(true);

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(0);

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, "user-1"));
    expect(participantResult).toHaveLength(0);
  });

  it("rolls back deleteUser-like Drizzle transaction on failure", async () => {
    await seedUser("user-1", "auth-1", "Test", "User");
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Test Trip 2");
    await seedParticipant("tp-1", "user-1", "trip-1");
    await seedParticipant("tp-2", "user-1", "trip-2");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .delete(tripParticipants)
          .where(and(eq(tripParticipants.userId, "user-1"), eq(tripParticipants.tripId, "trip-1")));
        const remaining = await tx
          .select({ count: count() })
          .from(tripParticipants)
          .where(eq(tripParticipants.userId, "user-1"));
        if (remaining[0].count === 0) {
          await tx.delete(users).where(eq(users.id, "user-1"));
        }
        throw new Error("Simulated failure");
      });
    } catch {
      // Expected rollback
    }

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(1);

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.userId, "user-1"));
    expect(participantResult).toHaveLength(2);
  });

  it("updateWristNumber detects conflict when wrist number already assigned", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedTrip("trip-1", "Test Trip");
    await seedParticipant("tp-1", "user-1", "trip-1", undefined, "W001");
    await seedParticipant("tp-2", "user-2", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "alice@example.com" },
    });

    await expect(
      updateWristNumber(ctx, {
        userId: "user-2",
        tripId: "trip-1",
        wristNumber: "W001",
      }),
    ).rejects.toThrow("Numer opaski");
  });

  it("banUserUntil calculates ban duration correctly", async () => {
    await seedUser("user-1", "auth-1", "Test", "User");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const futureMs = Date.now() + 3600000;
    const result = await banUserUntil(ctx, {
      userId: "user-1",
      bannedUntilMs: futureMs,
      reason: "Test ban",
    });

    expect(result.bannedUntil).toBeDefined();
    const bannedDate = new Date(result.bannedUntil);
    expect(bannedDate.getTime()).toBeGreaterThan(Date.now());
  });

  it("commits createUser-like Drizzle transaction successfully", async () => {
    const now = new Date();

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });

    await testDb.db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(tripParticipants).values({
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        createdAt: now,
        updatedAt: now,
      });
    });

    const userResult = await testDb.db.select().from(users).where(eq(users.id, "user-1"));
    expect(userResult).toHaveLength(1);
    expect(userResult[0].firstName).toBe("Test");

    const participantResult = await testDb.db
      .select()
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(participantResult).toHaveLength(1);
    expect(participantResult[0].userId).toBe("user-1");
  });
});
