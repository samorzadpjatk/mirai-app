import { groups, tripParticipants, trips, users } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { and, count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createContext,
  createMockSupabase,
  seedGroup,
  seedParticipant,
  seedTrip,
  seedUser,
} from "../../../test-helpers";
import {
  banUserUntil,
  createUser,
  deleteUser,
  removeHouseNumber,
  removeWristNumber,
  updateAvatar,
  updateHouseNumber,
  updateMyProfile,
  updateName,
  updateUserAdminStatus,
  updateWristNumber,
} from "../user/mutations";
import {
  getAll,
  getAllAdminsNames,
  getBanStatus,
  getBanStatusByEmail,
  getById,
  getByIdWithGroup,
  getMy,
  getMyWithGroup,
  getTripParticipant,
  searchWithPagination,
} from "../user/queries";

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

describe("raw PGLite transaction rollback", () => {
  it("rolls back createUser transaction on failure", async () => {
    const now = new Date();

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
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
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now,
      updatedAt: now,
    });
    await testDb.db.insert(trips).values({
      id: "trip-2",
      name: "Test Trip 2",
      description: "",
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
      description: "",
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

describe("Drizzle ORM PGLite integration", () => {
  it("getById returns user with correct fields", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", undefined, "W001", "H101");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1");

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
    await seedTrip(testDb.db, "trip-1", "Test Trip");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedTrip(testDb.db, "trip-2", "Test Trip 2");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");
    await seedParticipant(testDb.db, "tp-2", "user-1", "trip-2");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", undefined, "W001");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1");

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
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");

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
      description: "",
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

  it("getBanStatus returns not banned when no access token", async () => {
    const baseCtx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    const ctx = { ...baseCtx, accessToken: null };

    const result = await getBanStatus(ctx);

    expect(result.banned).toBe(false);
    expect(result.bannedUntil).toBe("");
    expect(result.reason).toBe("");
  });

  it("getBanStatus returns ban status for banned user", async () => {
    const futureIso = new Date(Date.now() + 3600000).toISOString();
    const ctx = createContext(testDb, { emails: { "auth-1": "user@example.com" } });
    ctx.supabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    ctx.supabase.auth.admin.getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "auth-1",
          email: "user@example.com",
          banned_until: futureIso,
          app_metadata: { ban_reason: "Test ban" },
        },
      },
      error: null,
    });

    const result = await getBanStatus(ctx);

    expect(result.banned).toBe(true);
    expect(result.bannedUntil).toBe(futureIso);
    expect(result.reason).toBe("Test ban");
  });

  it("updateUserAdminStatus updates user role", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await updateUserAdminStatus(ctx, {
      userId: "user-1",
      role: "ADMIN",
    });

    expect(result.role).toBe("ADMIN");
  });

  it("updateUserAdminStatus forbids self-demotion", async () => {
    await seedUser(testDb.db, "admin-1", "auth-admin", "Admin", "User");
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-admin": "admin@example.com" },
    });

    await expect(
      updateUserAdminStatus(ctx, {
        userId: "admin-1",
        role: "USER",
      }),
    ).rejects.toThrow("Nie możesz usunąć swoich uprawnień administratora");
  });

  it("updateAvatar updates hasAvatar flag", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
    });

    const result = await updateAvatar(ctx, { hasAvatar: true });
    expect(result.hasAvatar).toBe(true);

    const result2 = await updateAvatar(ctx, { hasAvatar: false });
    expect(result2.hasAvatar).toBe(false);
  });

  it("updateMyProfile updates first and last name", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Old", "Name");
    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
    });

    const result = await updateMyProfile(ctx, {
      firstName: "New",
      lastName: "Name",
    });

    expect(result.firstName).toBe("New");
    expect(result.lastName).toBe("Name");
  });

  it("getById returns null when user not found", async () => {
    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
    });

    const result = await getById(ctx, { id: "nonexistent" });

    expect(result).toBeNull();
  });

  it("getAll returns empty array when no participants", async () => {
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
    });

    const result = await getAll(ctx, { tripId: "trip-1" });

    expect(result).toEqual([]);
  });

  it("searchWithPagination returns all participants when search term is empty", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com", "auth-2": "bob@example.com" },
    });

    const result = await searchWithPagination(ctx, {
      tripId: "trip-1",
      field: "firstName",
      searchTerm: "",
      pagination: { limit: 10, offset: 0 },
    });

    expect(result.users).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("searchWithPagination returns empty result when no matches", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com" },
    });

    const result = await searchWithPagination(ctx, {
      tripId: "trip-1",
      field: "firstName",
      searchTerm: "Zzz",
      pagination: { limit: 10, offset: 0 },
    });

    expect(result.users).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
  });

  it("updateName updates user first and last name", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Old", "Name");
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await updateName(ctx, {
      userId: "user-1",
      firstName: "NewFirst",
      lastName: "NewLast",
    });

    expect(result.firstName).toBe("NewFirst");
    expect(result.lastName).toBe("NewLast");
  });

  it("updateName throws when user not found", async () => {
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      updateName(ctx, {
        userId: "nonexistent",
        firstName: "Test",
        lastName: "User",
      }),
    ).rejects.toThrow("Failed to update user");
  });

  it("removeWristNumber removes wrist number from participant", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", undefined, "W001");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await removeWristNumber(ctx, {
      userId: "user-1",
      tripId: "trip-1",
    });

    expect(result.wristNumber).toBeNull();
  });

  it("updateHouseNumber updates house number for participant", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await updateHouseNumber(ctx, {
      userId: "user-1",
      tripId: "trip-1",
      houseNumber: "H101",
    });

    expect(result.houseNumber).toBe("H101");
  });

  it("removeHouseNumber removes house number from participant", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", undefined, undefined, "H101");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await removeHouseNumber(ctx, {
      userId: "user-1",
      tripId: "trip-1",
    });

    expect(result.houseNumber).toBeNull();
  });

  it("getByIdWithGroup returns user with group info", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
    });

    const result = await getByIdWithGroup(ctx, {
      id: "user-1",
      tripId: "trip-1",
    });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-1");
    expect(result?.trips).toBeDefined();
    expect(result?.trips?.length).toBe(1);
    expect(result?.trips?.[0]?.group?.name).toBe("Team A");
  });

  it("getMyWithGroup returns current user with group info", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedGroup(testDb.db, "group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
    });

    const result = await getMyWithGroup(ctx, { tripId: "trip-1" });

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-1");
  });

  it("getMy returns current user with email", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");

    const ctx = createContext(testDb, {
      dbUser: { id: "user-1", role: "USER" },
      emails: { "auth-1": "user@example.com" },
    });

    const result = await getMy(ctx);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-1");
    expect(result?.email).toBe("user@example.com");
  });

  it("getMy returns null when user not found", async () => {
    const ctx = createContext(testDb, {
      dbUser: { id: "nonexistent", role: "USER" },
    });

    const result = await getMy(ctx);

    expect(result).toBeNull();
  });

  it("getAllAdminsNames returns all admin users", async () => {
    await seedUser(testDb.db, "admin-1", "auth-1", "Alice", "Smith", "ADMIN");
    await seedUser(testDb.db, "user-1", "auth-2", "Bob", "Jones", "USER");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    const result = await getAllAdminsNames(ctx);

    expect(result).toHaveLength(1);
    expect(result[0]?.firstName).toBe("Alice");
  });

  it("banUserUntil throws NOT_FOUND when user does not exist", async () => {
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      banUserUntil(ctx, {
        userId: "nonexistent",
        bannedUntilMs: Date.now() + 3600000,
        reason: "Test",
      }),
    ).rejects.toThrow("User not found");
  });

  it("banUserUntil throws BAD_REQUEST for invalid ban date", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      banUserUntil(ctx, {
        userId: "user-1",
        bannedUntilMs: Number.NaN,
        reason: "Test",
      }),
    ).rejects.toThrow("Invalid ban date");
  });

  it("banUserUntil throws BAD_REQUEST when ban date is in the past", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      banUserUntil(ctx, {
        userId: "user-1",
        bannedUntilMs: Date.now() - 3600000,
        reason: "Test",
      }),
    ).rejects.toThrow("Ban date must be in the future");
  });

  it("deleteUser throws NOT_FOUND when user does not exist", async () => {
    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      deleteUser(ctx, {
        userId: "nonexistent",
        tripId: "trip-1",
      }),
    ).rejects.toThrow("User not found");
  });

  it("deleteUser throws NOT_FOUND when participant does not exist", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Test", "User");
    await seedTrip(testDb.db, "trip-1", "Test Trip");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });

    await expect(
      deleteUser(ctx, {
        userId: "user-1",
        tripId: "trip-1",
      }),
    ).rejects.toThrow("User is not assigned to this trip");
  });

  it("createUser throws BAD_REQUEST when supabase createUser fails", async () => {
    await seedTrip(testDb.db, "trip-1", "Test Trip");

    const ctx = createContext(testDb, {
      dbUser: { id: "admin-1", role: "ADMIN" },
    });
    ctx.supabase.auth.admin.createUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Email already in use" },
    });

    await expect(
      createUser(ctx, {
        tripId: "trip-1",
        firstName: "New",
        lastName: "User",
        email: "existing@example.com",
      }),
    ).rejects.toThrow("Email already in use");
  });

  it("searchWithPagination works with email field", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com" },
    });

    const result = await searchWithPagination(ctx, {
      tripId: "trip-1",
      field: "email",
      searchTerm: "alice",
      pagination: { limit: 10, offset: 0 },
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]?.email).toBe("alice@example.com");
  });

  it("searchWithPagination works with houseNumber field", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Test Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", undefined, undefined, "H101");

    const ctx = createContext(testDb, {
      dbUser: { id: "mod-1", role: "MODERATOR" },
      emails: { "auth-1": "alice@example.com" },
    });

    const result = await searchWithPagination(ctx, {
      tripId: "trip-1",
      field: "houseNumber",
      searchTerm: "H10",
      pagination: { limit: 10, offset: 0 },
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0]?.houseNumber).toBe("H101");
  });

  it("getBanStatus returns not banned when getUser returns error", async () => {
    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    ctx.supabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const result = await getBanStatus(ctx);

    expect(result.banned).toBe(false);
    expect(result.bannedUntil).toBe("");
    expect(result.reason).toBe("");
  });

  it("getBanStatus returns not banned when admin lookup fails", async () => {
    const futureIso = new Date(Date.now() + 3600000).toISOString();
    const ctx = createContext(testDb, { dbUser: { id: "user-1", role: "USER" } });
    ctx.supabase.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "auth-1" } },
      error: null,
    });
    ctx.supabase.auth.admin.getUserById = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Admin lookup failed" },
    });

    const result = await getBanStatus(ctx);

    expect(result.banned).toBe(false);
    expect(result.bannedUntil).toBe("");
    expect(result.reason).toBe("");
  });

  it("getBanStatusByEmail returns not found when user does not exist", async () => {
    const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });
    ctx.supabase.auth.admin.listUsers = vi.fn().mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const result = await getBanStatusByEmail(ctx, { email: "nonexistent@example.com" });

    expect(result.exists).toBe(false);
    expect(result.banned).toBe(false);
    expect(result.bannedUntil).toBe("");
    expect(result.reason).toBe("");
  });

  it("getBanStatusByEmail throws when listUsers returns error", async () => {
    const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });
    ctx.supabase.auth.admin.listUsers = vi.fn().mockResolvedValue({
      data: { users: null },
      error: { message: "Failed to list users" },
    });

    await expect(getBanStatusByEmail(ctx, { email: "test@example.com" })).rejects.toThrow(
      "Failed to list users",
    );
  });

  it("getBanStatusByEmail returns ban status for existing user", async () => {
    const futureIso = new Date(Date.now() + 3600000).toISOString();
    const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });
    ctx.supabase.auth.admin.listUsers = vi.fn().mockResolvedValue({
      data: {
        users: [
          {
            id: "auth-1",
            email: "user@example.com",
            banned_until: futureIso,
            app_metadata: { ban_reason: "Test ban" },
          },
        ],
      },
      error: null,
    });
    ctx.supabase.auth.admin.getUserById = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "auth-1",
          email: "user@example.com",
          banned_until: futureIso,
          app_metadata: { ban_reason: "Test ban" },
        },
      },
      error: null,
    });

    const result = await getBanStatusByEmail(ctx, { email: "user@example.com" });

    expect(result.exists).toBe(true);
    expect(result.banned).toBe(true);
    expect(result.bannedUntil).toBe(futureIso);
    expect(result.reason).toBe("Test ban");
  });

  it("getBanStatusByEmail throws when getUserById returns error", async () => {
    const ctx = createContext(testDb, { dbUser: { id: "admin-1", role: "ADMIN" } });
    ctx.supabase.auth.admin.listUsers = vi.fn().mockResolvedValue({
      data: {
        users: [{ id: "auth-1", email: "user@example.com" }],
      },
      error: null,
    });
    ctx.supabase.auth.admin.getUserById = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "User not found" },
    });

    await expect(getBanStatusByEmail(ctx, { email: "user@example.com" })).rejects.toThrow(
      "User not found",
    );
  });
});
