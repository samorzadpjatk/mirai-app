import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { createPgliteTestDb } from "../test-helper";
import { users } from "../schema";

describe("PGLite Test Helper", () => {
  it("should create an in-memory database with the production schema", async () => {
    const { db, cleanup } = await createPgliteTestDb();
    
    // Insert a test user
    const [user] = await db.insert(users).values({
      id: "test-user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    expect(user.id).toBe("test-user-1");
    expect(user.firstName).toBe("Test");
    
    // Query the user back
    const result = await db.select().from(users).where(eq(users.id, "test-user-1"));
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe("Test");
    
    await cleanup();
  });
  
  it("should reset the database state", async () => {
    const { db, reset, cleanup } = await createPgliteTestDb();
    
    // Insert a user
    await db.insert(users).values({
      id: "test-user-2",
      authUserId: "auth-2",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Reset
    await reset();
    
    // Verify user is gone
    const result = await db.select().from(users).where(eq(users.id, "test-user-2"));
    expect(result).toHaveLength(0);
    
    await cleanup();
  });
});
