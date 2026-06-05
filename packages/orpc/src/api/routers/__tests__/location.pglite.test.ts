import { locationShares, locationSharingRequests, locations, users } from "@mirai-app/db";
import { toExpoLocation } from "@mirai-app/shared/locations";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";

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

describe("location router — PGLite transaction rollback", () => {
  beforeEach(async () => {
    // Seed users (required parent table for FK constraints)
    await testDb.db.insert(users).values([
      {
        id: "user-sender",
        authUserId: "auth-sender",
        firstName: "Sender",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "user-receiver",
        authUserId: "auth-receiver",
        firstName: "Receiver",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    // Seed a pending location sharing request
    await testDb.db.insert(locationSharingRequests).values({
      id: "req-1",
      senderId: "user-sender",
      receiverId: "user-receiver",
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    // Seed initial locations for both users
    await testDb.db.insert(locations).values([
      {
        id: "loc-sender",
        userId: "user-sender",
        timestamp: now(),
        isSharingLocation: false,
        latitude: 52.2297,
        longitude: 21.0122,
      },
      {
        id: "loc-receiver",
        userId: "user-receiver",
        timestamp: now(),
        isSharingLocation: false,
        latitude: 52.2298,
        longitude: 21.0123,
      },
    ]);
  });

  it("rolls back location sharing request update on transaction failure", async () => {
    const initial = await testDb.db
      .select({ status: locationSharingRequests.status })
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(initial[0].status).toBe("PENDING");

    try {
      await testDb.db.transaction(async (tx) => {
        await tx
          .update(locationSharingRequests)
          .set({ status: "ACCEPTED" })
          .where(eq(locationSharingRequests.id, "req-1"));
        throw new Error("Simulated failure after update");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRollback = await testDb.db
      .select({ status: locationSharingRequests.status })
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(afterRollback[0].status).toBe("PENDING");
  });

  it("rolls back all tables on acceptLocationSharingRequest transaction failure", async () => {
    const initialRequest = await testDb.db
      .select({ status: locationSharingRequests.status })
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(initialRequest[0].status).toBe("PENDING");

    const initialSenderLocation = await testDb.db
      .select({ isSharingLocation: locations.isSharingLocation })
      .from(locations)
      .where(eq(locations.userId, "user-sender"));
    expect(initialSenderLocation[0].isSharingLocation).toBe(false);

    try {
      await testDb.db.transaction(async (tx) => {
        // Update request status
        await tx
          .update(locationSharingRequests)
          .set({ status: "ACCEPTED" })
          .where(eq(locationSharingRequests.id, "req-1"));
        // Update sender location
        await tx
          .update(locations)
          .set({ isSharingLocation: true, timestamp: now() })
          .where(eq(locations.userId, "user-sender"));
        // Insert sender -> receiver share
        await tx
          .insert(locationShares)
          .values({ locationId: "loc-sender", userId: "user-receiver" });
        // Update receiver location
        await tx
          .update(locations)
          .set({ isSharingLocation: true, timestamp: now() })
          .where(eq(locations.userId, "user-receiver"));
        // Insert receiver -> sender share
        await tx
          .insert(locationShares)
          .values({ locationId: "loc-receiver", userId: "user-sender" });
        throw new Error("Simulated failure after all updates");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const afterRollbackRequest = await testDb.db
      .select({ status: locationSharingRequests.status })
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(afterRollbackRequest[0].status).toBe("PENDING");

    const afterSenderLocation = await testDb.db
      .select({ isSharingLocation: locations.isSharingLocation })
      .from(locations)
      .where(eq(locations.userId, "user-sender"));
    expect(afterSenderLocation[0].isSharingLocation).toBe(false);

    const afterReceiverLocation = await testDb.db
      .select({ isSharingLocation: locations.isSharingLocation })
      .from(locations)
      .where(eq(locations.userId, "user-receiver"));
    expect(afterReceiverLocation[0].isSharingLocation).toBe(false);

    const shares = await testDb.db.select().from(locationShares);
    expect(shares).toHaveLength(0);
  });

  it("commits successfully when no failure occurs", async () => {
    await testDb.db.transaction(async (tx) => {
      // Update request status
      await tx
        .update(locationSharingRequests)
        .set({ status: "ACCEPTED" })
        .where(eq(locationSharingRequests.id, "req-1"));
      // Update sender location
      await tx
        .update(locations)
        .set({ isSharingLocation: true, timestamp: now() })
        .where(eq(locations.userId, "user-sender"));
      // Insert sender -> receiver share
      await tx.insert(locationShares).values({ locationId: "loc-sender", userId: "user-receiver" });
      // Update receiver location
      await tx
        .update(locations)
        .set({ isSharingLocation: true, timestamp: now() })
        .where(eq(locations.userId, "user-receiver"));
      // Insert receiver -> sender share
      await tx.insert(locationShares).values({ locationId: "loc-receiver", userId: "user-sender" });
    });

    const afterCommitRequest = await testDb.db
      .select({ status: locationSharingRequests.status })
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(afterCommitRequest[0].status).toBe("ACCEPTED");

    const senderLocation = await testDb.db
      .select({ isSharingLocation: locations.isSharingLocation })
      .from(locations)
      .where(eq(locations.userId, "user-sender"));
    expect(senderLocation[0].isSharingLocation).toBe(true);

    const receiverLocation = await testDb.db
      .select({ isSharingLocation: locations.isSharingLocation })
      .from(locations)
      .where(eq(locations.userId, "user-receiver"));
    expect(receiverLocation[0].isSharingLocation).toBe(true);

    const shares = await testDb.db.select().from(locationShares);
    expect(shares).toHaveLength(2);
  });
});

describe("location router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    // Seed users (required parent table for FK constraints)
    await testDb.db.insert(users).values([
      {
        id: "user-sender",
        authUserId: "auth-sender",
        firstName: "Sender",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "user-receiver",
        authUserId: "auth-receiver",
        firstName: "Receiver",
        lastName: "User",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    // Seed a pending location sharing request
    await testDb.db.insert(locationSharingRequests).values({
      id: "req-1",
      senderId: "user-sender",
      receiverId: "user-receiver",
      status: "PENDING",
      createdAt: now(),
      updatedAt: now(),
    });

    // Seed initial locations for both users
    await testDb.db.insert(locations).values([
      {
        id: "loc-sender",
        userId: "user-sender",
        timestamp: now(),
        isSharingLocation: false,
        latitude: 52.2297,
        longitude: 21.0122,
      },
      {
        id: "loc-receiver",
        userId: "user-receiver",
        timestamp: now(),
        isSharingLocation: false,
        latitude: 52.2298,
        longitude: 21.0123,
      },
    ]);
  });

  it("commits acceptLocationSharingRequest via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      // Update request status
      await tx
        .update(locationSharingRequests)
        .set({ status: "ACCEPTED" })
        .where(eq(locationSharingRequests.id, "req-1"));

      // Update sender location
      await tx
        .update(locations)
        .set({ isSharingLocation: true, timestamp: now() })
        .where(eq(locations.userId, "user-sender"));

      // Insert sender -> receiver share
      await tx.insert(locationShares).values({
        locationId: "loc-sender",
        userId: "user-receiver",
      });

      // Update receiver location
      await tx
        .update(locations)
        .set({ isSharingLocation: true, timestamp: now() })
        .where(eq(locations.userId, "user-receiver"));

      // Insert receiver -> sender share
      await tx.insert(locationShares).values({
        locationId: "loc-receiver",
        userId: "user-sender",
      });
    });

    const request = await testDb.db
      .select()
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(request[0].status).toBe("ACCEPTED");

    const senderLocation = await testDb.db
      .select()
      .from(locations)
      .where(eq(locations.userId, "user-sender"));
    expect(senderLocation[0].isSharingLocation).toBe(true);

    const receiverLocation = await testDb.db
      .select()
      .from(locations)
      .where(eq(locations.userId, "user-receiver"));
    expect(receiverLocation[0].isSharingLocation).toBe(true);

    const shares = await testDb.db.select().from(locationShares);
    expect(shares).toHaveLength(2);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        // Update request status
        await tx
          .update(locationSharingRequests)
          .set({ status: "ACCEPTED" })
          .where(eq(locationSharingRequests.id, "req-1"));

        // Update sender location
        await tx
          .update(locations)
          .set({ isSharingLocation: true, timestamp: now() })
          .where(eq(locations.userId, "user-sender"));

        // Insert sender -> receiver share
        await tx.insert(locationShares).values({
          locationId: "loc-sender",
          userId: "user-receiver",
        });

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const request = await testDb.db
      .select()
      .from(locationSharingRequests)
      .where(eq(locationSharingRequests.id, "req-1"));
    expect(request[0].status).toBe("PENDING");

    const senderLocation = await testDb.db
      .select()
      .from(locations)
      .where(eq(locations.userId, "user-sender"));
    expect(senderLocation[0].isSharingLocation).toBe(false);

    const shares = await testDb.db.select().from(locationShares);
    expect(shares).toHaveLength(0);
  });

  it("validates toExpoLocation with real PGLite data", async () => {
    const dbLocations = await testDb.db
      .select()
      .from(locations)
      .where(eq(locations.userId, "user-sender"));

    const dbLocation = dbLocations[0];

    // PGLite uses the production schema where timestamp is already a Date object
    const result = toExpoLocation(dbLocation);

    expect(result.coords.latitude).toBe(52.2297);
    expect(result.coords.longitude).toBe(21.0122);
    expect(result.coords.altitude).toBeNull();
    expect(result.coords.accuracy).toBe(0);
    expect(result.timestamp).toBe(dbLocation.timestamp.getTime());
  });
});
