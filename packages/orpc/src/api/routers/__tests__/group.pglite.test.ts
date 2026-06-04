import {
  coinTransactions,
  groupJoinRequests,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { and, eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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

describe("group router — PGLite transaction rollback", () => {
  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });
  }

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

  async function seedGroup(
    id: string,
    tripId: string,
    organizerId: string,
    code: string,
    coins = 0,
  ) {
    await testDb.db.insert(groups).values({
      id,
      tripId,
      name: `Group ${id}`,
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

  it("rolls back create mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");
    await seedParticipant("tp-1", "user-1", "trip-1");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .insert(tripParticipants)
          .values({
            id: "tp-1",
            userId: "user-1",
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: "group-1", updatedAt: now() },
          });

        await tx
          .delete(groupJoinRequests)
          .where(
            and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-1")),
          );

        throw new Error("Simulated failure after create transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(and(eq(tripParticipants.userId, "user-1"), eq(tripParticipants.tripId, "trip-1")));
    expect(afterParticipant[0].groupId).toBeNull();

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-1")));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back deleteGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(eq(tripParticipants.groupId, "group-1"));

        await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, "group-1"));

        await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

        throw new Error("Simulated failure after deleteGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterGroup = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].isDeleted).toBe(false);

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(afterParticipant[0].groupId).toBe("group-1");

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.groupId, "group-1"));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back deleteMyGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-1");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(eq(tripParticipants.groupId, "group-1"));

        await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, "group-1"));

        await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));

        throw new Error("Simulated failure after deleteMyGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterGroup = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].isDeleted).toBe(false);

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-1"));
    expect(afterParticipant[0].groupId).toBe("group-1");

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.groupId, "group-1"));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back join mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .insert(tripParticipants)
          .values({
            id: "tp-2",
            userId: "user-2",
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: "group-1", updatedAt: now() },
          });

        await tx
          .delete(groupJoinRequests)
          .where(
            and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")),
          );

        throw new Error("Simulated failure after join transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(and(eq(tripParticipants.userId, "user-2"), eq(tripParticipants.tripId, "trip-1")));
    expect(afterParticipant[0].groupId).toBeNull();

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back respondToJoinRequest mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: "group-1" })
          .where(eq(tripParticipants.id, "tp-2"));

        await tx
          .delete(groupJoinRequests)
          .where(
            and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")),
          );

        throw new Error("Simulated failure after respondToJoinRequest transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(afterParticipant[0].groupId).toBeNull();

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back assignUserToGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedJoinRequest("gjr-1", "trip-1", "group-1", "user-2");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .insert(tripParticipants)
          .values({
            id: "tp-2",
            userId: "user-2",
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: "group-1", updatedAt: now() },
          });

        await tx
          .delete(groupJoinRequests)
          .where(
            and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")),
          );

        throw new Error("Simulated failure after assignUserToGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(and(eq(tripParticipants.userId, "user-2"), eq(tripParticipants.tripId, "trip-1")));
    expect(afterParticipant[0].groupId).toBeNull();

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(and(eq(groupJoinRequests.tripId, "trip-1"), eq(groupJoinRequests.userId, "user-2")));
    expect(afterRequestCount[0].count).toBe(1);
  });

  it("rolls back bulkAssignUsersToGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedUser("user-3", "Charlie", "Brown");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-2", "user-2", "trip-1");
    await seedParticipant("tp-3", "user-3", "trip-1");
    await seedJoinRequest("gjr-2", "trip-1", "group-1", "user-2");
    await seedJoinRequest("gjr-3", "trip-1", "group-1", "user-3");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .insert(tripParticipants)
          .values({
            id: "tp-2",
            userId: "user-2",
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: "group-1", updatedAt: now() },
          });

        await tx
          .insert(tripParticipants)
          .values({
            id: "tp-3",
            userId: "user-3",
            tripId: "trip-1",
            groupId: "group-1",
            createdAt: now(),
            updatedAt: now(),
          })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { groupId: "group-1", updatedAt: now() },
          });

        await tx
          .delete(groupJoinRequests)
          .where(
            and(
              eq(groupJoinRequests.tripId, "trip-1"),
              inArray(groupJoinRequests.userId, ["user-2", "user-3"]),
            ),
          );

        throw new Error("Simulated failure after bulkAssignUsersToGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRequestCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(groupJoinRequests)
      .where(eq(groupJoinRequests.groupId, "group-1"));
    expect(afterRequestCount[0].count).toBe(2);

    const afterParticipants = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(
        and(
          eq(tripParticipants.tripId, "trip-1"),
          inArray(tripParticipants.userId, ["user-2", "user-3"]),
        ),
      );
    expect(afterParticipants.every((p) => p.groupId === null)).toBe(true);
  });

  it("rolls back removeUserFromGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(eq(tripParticipants.id, "tp-2"));

        const membersLeft = await tx
          .select({ count: sql<number>`count(*)` })
          .from(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, "trip-1"), eq(tripParticipants.groupId, "group-1")),
          );

        if (membersLeft[0].count === 0) {
          await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, "group-1"));

          await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));
        }

        throw new Error("Simulated failure after removeUserFromGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterGroup = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].isDeleted).toBe(false);

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(afterParticipant[0].groupId).toBe("group-1");
  });

  it("rolls back leaveMyGroup mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedUser("user-2", "Bob", "Jones");
    await seedGroup("group-1", "trip-1", "user-1", "1234");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(tripParticipants)
          .set({ groupId: null })
          .where(and(eq(tripParticipants.userId, "user-2"), eq(tripParticipants.tripId, "trip-1")));

        const membersLeft = await tx
          .select({ count: sql<number>`count(*)` })
          .from(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, "trip-1"), eq(tripParticipants.groupId, "group-1")),
          );

        if (membersLeft[0].count === 0) {
          await tx.delete(groupJoinRequests).where(eq(groupJoinRequests.groupId, "group-1"));

          await tx.update(groups).set({ isDeleted: true }).where(eq(groups.id, "group-1"));
        }

        throw new Error("Simulated failure after leaveMyGroup transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterGroup = await testDb.db
      .select({ isDeleted: groups.isDeleted })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].isDeleted).toBe(false);

    const afterParticipant = await testDb.db
      .select({ groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.id, "tp-2"));
    expect(afterParticipant[0].groupId).toBe("group-1");
  });

  it("rolls back addCoins mutation transaction on failure", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${50}` })
          .where(eq(groups.id, "group-1"));

        await tx.insert(coinTransactions).values({
          id: "ct-1",
          groupId: "group-1",
          amount: 50,
          adminId: "user-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure after addCoins transaction operations");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterGroup = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].coins).toBe(100);

    const afterTxCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(afterTxCount[0].count).toBe(0);
  });

  it("commits addCoins mutation transaction successfully when no failure occurs", async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedUser("user-1", "Alice", "Smith");
    await seedGroup("group-1", "trip-1", "user-1", "1234", 100);

    await testDb.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({ coins: sql`${groups.coins} + ${50}` })
        .where(eq(groups.id, "group-1"));

      await tx.insert(coinTransactions).values({
        id: "ct-1",
        groupId: "group-1",
        amount: 50,
        adminId: "user-1",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const afterGroup = await testDb.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, "group-1"));
    expect(afterGroup[0].coins).toBe(150);

    const afterTxCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(afterTxCount[0].count).toBe(1);
  });
});

describe("group router — PGLite Drizzle ORM integration", () => {
  beforeEach(async () => {
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      startDate: now(),
      endDate: new Date(Date.now() + 86400000),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-user-1",
      firstName: "Alice",
      lastName: "Smith",
      role: "USER",
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(groups).values({
      id: "group-1",
      tripId: "trip-1",
      name: "Test Group",
      organizerId: "user-1",
      code: "1234",
      coins: 100,
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("updates group coins via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx
        .update(groups)
        .set({ coins: sql`${groups.coins} + ${50}` })
        .where(eq(groups.id, "group-1"));

      await tx.insert(coinTransactions).values({
        id: "ct-1",
        groupId: "group-1",
        amount: 50,
        adminId: "user-1",
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const result = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(result[0].coins).toBe(150);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(50);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${50}` })
          .where(eq(groups.id, "group-1"));

        await tx.insert(coinTransactions).values({
          id: "ct-1",
          groupId: "group-1",
          amount: 50,
          adminId: "user-1",
          createdAt: now(),
          updatedAt: now(),
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const result = await testDb.db.select().from(groups).where(eq(groups.id, "group-1"));
    expect(result[0].coins).toBe(100);

    const txs = await testDb.db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(0);
  });
});
