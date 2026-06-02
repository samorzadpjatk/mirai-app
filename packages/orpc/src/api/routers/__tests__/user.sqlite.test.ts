import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Database } from "bun:sqlite";
import { eq, and, count, sql } from "drizzle-orm";
import {
  createUserTestDb,
  seedUser,
  seedParticipant,
  seedGroup,
  seedTrip,
} from "./helpers/user-sqlite-db";
import {
  getById,
  getTripParticipant,
  getAll,
  searchWithPagination,
} from "../user/queries";
import {
  createUser,
  deleteUser,
  updateWristNumber,
  banUserUntil,
} from "../user/mutations";
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
        listUsers: vi
          .fn()
          .mockResolvedValue({
            data: { users: Object.values(users) },
            error: null,
          }),
        createUser: vi
          .fn()
          .mockImplementation(async ({ email }: { email: string }) => {
            const id = crypto.randomUUID();
            users[id] = { id, email };
            return { data: { user: { id, email } }, error: null };
          }),
        updateUserById: vi
          .fn()
          .mockImplementation(
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
  testDb: ReturnType<typeof createUserTestDb>,
  overrides: Partial<{
    dbUser: { id: string; role: string };
    emails: Record<string, string>;
  }> = {},
) {
  const dbUser = overrides.dbUser ?? { id: "mod-1", role: "MODERATOR" };
  const supabase = createMockSupabase(overrides.emails ?? {});
  return {
    db: testDb.drizzleDb as unknown as DB,
    supabase,
    dbUser,
    accessToken: "test-token",
  };
}

describe("raw SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        auth_user_id TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        has_avatar INTEGER DEFAULT 0 NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        last_seen_on INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE trip_participants (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        trip_id TEXT NOT NULL,
        group_id TEXT,
        wrist_number TEXT,
        house_number TEXT,
        role TEXT DEFAULT 'MEMBER' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back createUser transaction on failure", () => {
    const now = Date.now();

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["user-1", "auth-1", "Test", "User", "USER", now, now],
      );
      db.run(
        `INSERT INTO trip_participants (id, user_id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        ["tp-1", "user-1", "trip-1", now, now],
      );
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }

    const userCount = db
      .query("SELECT COUNT(*) as count FROM users WHERE id = ?")
      .get("user-1") as { count: number };
    expect(userCount.count).toBe(0);

    const participantCount = db
      .query("SELECT COUNT(*) as count FROM trip_participants WHERE id = ?")
      .get("tp-1") as { count: number };
    expect(participantCount.count).toBe(0);
  });

  it("rolls back deleteUser transaction on failure", () => {
    const now = Date.now();
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["user-1", "auth-1", "Test", "User", "USER", now, now],
    );
    db.run(
      `INSERT INTO trip_participants (id, user_id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      ["tp-1", "user-1", "trip-1", now, now],
    );
    db.run(
      `INSERT INTO trip_participants (id, user_id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      ["tp-2", "user-1", "trip-2", now, now],
    );

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `DELETE FROM trip_participants WHERE user_id = ? AND trip_id = ?`,
        ["user-1", "trip-1"],
      );
      const remaining = db
        .query("SELECT COUNT(*) as count FROM trip_participants WHERE user_id = ?")
        .get("user-1") as { count: number };
      if (remaining.count === 0) {
        db.run(`DELETE FROM users WHERE id = ?`, ["user-1"]);
      }
      throw new Error("Simulated failure after delete");
    } catch {
      db.exec("ROLLBACK");
    }

    const user = db
      .query("SELECT COUNT(*) as count FROM users WHERE id = ?")
      .get("user-1") as { count: number };
    expect(user.count).toBe(1);

    const participants = db
      .query("SELECT COUNT(*) as count FROM trip_participants WHERE user_id = ?")
      .get("user-1") as { count: number };
    expect(participants.count).toBe(2);
  });

  it("commits createUser transaction successfully", () => {
    const now = Date.now();
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["user-1", "auth-1", "Test", "User", "USER", now, now],
    );
    db.run(
      `INSERT INTO trip_participants (id, user_id, trip_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      ["tp-1", "user-1", "trip-1", now, now],
    );
    db.exec("COMMIT");

    const user = db
      .query("SELECT * FROM users WHERE id = ?")
      .get("user-1") as { first_name: string };
    expect(user.first_name).toBe("Test");

    const participant = db
      .query("SELECT * FROM trip_participants WHERE id = ?")
      .get("tp-1") as { user_id: string };
    expect(participant.user_id).toBe("user-1");
  });
});

describe("Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createUserTestDb>;

  beforeEach(() => {
    testDb = createUserTestDb();
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("getById returns user with correct fields", async () => {
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
    });

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
    seedUser(testDb.drizzleDb, { id: "user-1", authUserId: "auth-1" });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      wristNumber: "W001",
      houseNumber: "H101",
    });

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
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
    });
    seedUser(testDb.drizzleDb, {
      id: "user-2",
      authUserId: "auth-2",
      firstName: "Bob",
      lastName: "Jones",
    });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedGroup(testDb.drizzleDb, {
      id: "group-1",
      tripId: "trip-1",
      name: "Team A",
    });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "group-1",
    });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-2",
      userId: "user-2",
      tripId: "trip-1",
    });

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
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
    });
    seedUser(testDb.drizzleDb, {
      id: "user-2",
      authUserId: "auth-2",
      firstName: "Bob",
      lastName: "Jones",
    });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
    });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-2",
      userId: "user-2",
      tripId: "trip-1",
    });

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
    seedTrip(testDb.drizzleDb, { id: "trip-1" });

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

    const users = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteUsers)
      .where(eq(testDb.sqliteUsers.firstName, "New"));
    expect(users).toHaveLength(1);
    expect(users[0].firstName).toBe("New");

    const participants = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.tripId, "trip-1"));
    expect(participants).toHaveLength(1);
    expect(participants[0].userId).toBe(users[0].id);
  });

  it("rolls back createUser-like Drizzle transaction on failure", async () => {
    const now = new Date();

    // Use raw SQLite transaction since drizzle-orm/bun-sqlite transaction rollback
    // behavior depends on the specific driver implementation
    testDb.db.exec("BEGIN TRANSACTION");
    await testDb.drizzleDb.insert(testDb.sqliteUsers).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      createdAt: now,
      updatedAt: now,
    });
    await testDb.drizzleDb.insert(testDb.sqliteTripParticipants).values({
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      createdAt: now,
      updatedAt: now,
    });
    testDb.db.exec("ROLLBACK");

    const users = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteUsers)
      .where(eq(testDb.sqliteUsers.id, "user-1"));
    expect(users).toHaveLength(0);

    const participants = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.id, "tp-1"));
    expect(participants).toHaveLength(0);
  });

  it("deleteUser removes participant and user when no remaining trips", async () => {
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
    });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
    });

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await deleteUser(ctx, {
      userId: "user-1",
      tripId: "trip-1",
    });

    expect(result.deletedFromSystem).toBe(true);

    const users = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteUsers)
      .where(eq(testDb.sqliteUsers.id, "user-1"));
    expect(users).toHaveLength(0);

    const participants = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.userId, "user-1"));
    expect(participants).toHaveLength(0);
  });

  it("rolls back deleteUser-like Drizzle transaction on failure", async () => {
    seedUser(testDb.drizzleDb, { id: "user-1", authUserId: "auth-1" });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedTrip(testDb.drizzleDb, { id: "trip-2" });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
    });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-2",
      userId: "user-1",
      tripId: "trip-2",
    });

    testDb.db.exec("BEGIN TRANSACTION");
    await testDb.drizzleDb
      .delete(testDb.sqliteTripParticipants)
      .where(
        and(
          eq(testDb.sqliteTripParticipants.userId, "user-1"),
          eq(testDb.sqliteTripParticipants.tripId, "trip-1"),
        ),
      );
    const remaining = await testDb.drizzleDb
      .select({ count: count() })
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.userId, "user-1"));
    if (remaining[0].count === 0) {
      await testDb.drizzleDb
        .delete(testDb.sqliteUsers)
        .where(eq(testDb.sqliteUsers.id, "user-1"));
    }
    testDb.db.exec("ROLLBACK");

    const users = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteUsers)
      .where(eq(testDb.sqliteUsers.id, "user-1"));
    expect(users).toHaveLength(1);

    const participants = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.userId, "user-1"));
    expect(participants).toHaveLength(2);
  });

  it("updateWristNumber detects conflict when wrist number already assigned", async () => {
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Alice",
      lastName: "Smith",
    });
    seedUser(testDb.drizzleDb, {
      id: "user-2",
      authUserId: "auth-2",
      firstName: "Bob",
      lastName: "Jones",
    });
    seedTrip(testDb.drizzleDb, { id: "trip-1" });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-1",
      userId: "user-1",
      tripId: "trip-1",
      wristNumber: "W001",
    });
    seedParticipant(testDb.drizzleDb, {
      id: "tp-2",
      userId: "user-2",
      tripId: "trip-1",
    });

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
    seedUser(testDb.drizzleDb, {
      id: "user-1",
      authUserId: "auth-1",
    });

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

    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteUsers).values({
        id: "user-1",
        authUserId: "auth-1",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(testDb.sqliteTripParticipants).values({
        id: "tp-1",
        userId: "user-1",
        tripId: "trip-1",
        createdAt: now,
        updatedAt: now,
      });
    });

    const users = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteUsers)
      .where(eq(testDb.sqliteUsers.id, "user-1"));
    expect(users).toHaveLength(1);
    expect(users[0].firstName).toBe("Test");

    const participants = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteTripParticipants)
      .where(eq(testDb.sqliteTripParticipants.id, "tp-1"));
    expect(participants).toHaveLength(1);
    expect(participants[0].userId).toBe("user-1");
  });
});
