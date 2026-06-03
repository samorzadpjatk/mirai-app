import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { createPgliteTestDb } from "../test-helper";
import { users, trips } from "../schema";

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
    // Create a temporary table with a serial column
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "test_serial_table" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    // Create a drizzle table object so reset() can discover and truncate it
    const { pgTable, serial, text } = await import("drizzle-orm/pg-core");
    const testSerialTable = pgTable("test_serial_table", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
    });

    try {
      // Insert rows — serial should auto-increment
      await db.execute(sql`INSERT INTO "test_serial_table" (name) VALUES ('first')`);
      await db.execute(sql`INSERT INTO "test_serial_table" (name) VALUES ('second')`);

      const beforeReset = await db.execute(sql`SELECT MAX(id) as max_id FROM "test_serial_table"`);
      expect(beforeReset.rows[0].max_id).toBe(2);

      // Reset — this should truncate the table and restart its sequence
      await reset([testSerialTable]);

      // Insert after reset — sequence should restart at 1
      const afterReset = await db.execute(sql`
        INSERT INTO "test_serial_table" (name) VALUES ('after-reset') RETURNING id
      `);
      expect(afterReset.rows[0].id).toBe(1);
    } finally {
      // Clean up: drop the test table
      await db.execute(sql`DROP TABLE IF EXISTS "test_serial_table"`);
    }
  });
});
