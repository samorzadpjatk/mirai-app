import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "../pglite";
import { trips, users } from "../schema";

describe("PGLite Test Helper", () => {
  let db: Awaited<ReturnType<typeof createPgliteTestDb>>["db"];
  let reset: Awaited<ReturnType<typeof createPgliteTestDb>>["reset"];
  let cleanup: Awaited<ReturnType<typeof createPgliteTestDb>>["cleanup"];

  beforeAll(async () => {
    const testDb = await createPgliteTestDb();
    db = testDb.db;
    reset = testDb.reset;
    cleanup = testDb.cleanup;
  });

  beforeEach(async () => {
    await reset();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("should create an in-memory database with the production schema", async () => {
    // Insert a test user
    const [user] = await db
      .insert(users)
      .values({
        id: "test-user-1",
        authUserId: "auth-1",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    expect(user.id).toBe("test-user-1");
    expect(user.firstName).toBe("Test");

    // Query the user back
    const result = await db.select().from(users).where(eq(users.id, "test-user-1"));
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Test");
  });

  it("should reset the database state", async () => {
    // Insert a user
    await db
      .insert(users)
      .values({
        id: "test-user-2",
        authUserId: "auth-2",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Reset
    await reset();

    // Verify user is gone
    const result = await db.select().from(users).where(eq(users.id, "test-user-2"));
    expect(result).toHaveLength(0);
  });

  it("should clear ALL schema tables on reset", async () => {
    // Insert data into multiple tables
    await db.insert(users).values({
      id: "test-user-multi",
      authUserId: "auth-multi",
      firstName: "Multi",
      lastName: "Table",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(trips).values({
      id: "test-trip-1",
      name: "Test Trip",
      description: "A test trip",
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verify both exist
    const userResult = await db.select().from(users).where(eq(users.id, "test-user-multi"));
    expect(userResult).toHaveLength(1);

    const tripResult = await db.select().from(trips).where(eq(trips.id, "test-trip-1"));
    expect(tripResult).toHaveLength(1);

    // Reset
    await reset();

    // Verify both are gone
    const userResultAfter = await db.select().from(users).where(eq(users.id, "test-user-multi"));
    expect(userResultAfter).toHaveLength(0);

    const tripResultAfter = await db.select().from(trips).where(eq(trips.id, "test-trip-1"));
    expect(tripResultAfter).toHaveLength(0);
  });

  it("should restart sequences on reset", async () => {
    await db.insert(users).values({
      id: "seq-test-user",
      authUserId: "auth-seq",
      firstName: "Sequence",
      lastName: "Test",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(trips).values({
      id: "seq-test-trip",
      name: "Sequence Test Trip",
      description: "Testing sequence restart",
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const userResult = await db.select().from(users).where(eq(users.id, "seq-test-user"));
    expect(userResult).toHaveLength(1);

    const tripResult = await db.select().from(trips).where(eq(trips.id, "seq-test-trip"));
    expect(tripResult).toHaveLength(1);

    await reset();

    const userResultAfter = await db.select().from(users).where(eq(users.id, "seq-test-user"));
    expect(userResultAfter).toHaveLength(0);

    const tripResultAfter = await db.select().from(trips).where(eq(trips.id, "seq-test-trip"));
    expect(tripResultAfter).toHaveLength(0);

    const allUsers = await db.select().from(users);
    const allTrips = await db.select().from(trips);
    expect(allUsers).toHaveLength(0);
    expect(allTrips).toHaveLength(0);
  });
});
