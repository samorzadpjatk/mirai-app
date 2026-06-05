import { sponsors, tripSponsors, trips } from "@mirai-app/db";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { addToTrip, create, deleteSponsor, removeFromTrip, update } from "../sponsor/mutations";
import { getAll, getById, getByTripId } from "../sponsor/queries";

describe("sponsor router — PGLite integration", () => {
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

  async function seedSponsor(id: string, name: string, isActive: boolean) {
    await testDb.db.insert(sponsors).values({
      id,
      name,
      description: "A test sponsor",
      logoPath: "/logo.png",
      isActive,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTrip(id: string, name: string) {
    await testDb.db.insert(trips).values({
      id,
      name,
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTripSponsor(id: string, tripId: string, sponsorId: string) {
    await testDb.db.insert(tripSponsors).values({ id, tripId, sponsorId, createdAt: now() });
  }

  it("rolls back sponsor insert on transaction failure", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    const initial = await testDb.db.select({ count: sql<number>`count(*)` }).from(sponsors);
    expect(initial[0].count).toBe(1);

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(sponsors).values({
          id: "sponsor-2",
          name: "New Sponsor",
          description: "New",
          logoPath: "/new.png",
          isActive: true,
          createdAt: now(),
          updatedAt: now(),
        });
        throw new Error("Simulated failure after insert");
      }),
    ).rejects.toThrow("Simulated failure after insert");

    const afterRollback = await testDb.db.select({ count: sql<number>`count(*)` }).from(sponsors);
    expect(afterRollback[0].count).toBe(1);
  });

  it("rolls back trip sponsor association on transaction failure", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTrip("trip-1", "Summer Camp");
    const initial = await testDb.db.select({ count: sql<number>`count(*)` }).from(tripSponsors);
    expect(initial[0].count).toBe(0);

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(tripSponsors).values({
          id: "ts-1",
          tripId: "trip-1",
          sponsorId: "sponsor-1",
          createdAt: now(),
        });
        throw new Error("Simulated failure after insert");
      }),
    ).rejects.toThrow("Simulated failure after insert");

    const afterRollback = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(tripSponsors);
    expect(afterRollback[0].count).toBe(0);
  });

  it("commits sponsor and trip sponsor association successfully", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTrip("trip-1", "Summer Camp");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(sponsors).values({
        id: "sponsor-2",
        name: "New Sponsor",
        description: "New",
        logoPath: "/new.png",
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      });
      await tx.insert(tripSponsors).values({
        id: "ts-1",
        tripId: "trip-1",
        sponsorId: "sponsor-2",
        createdAt: now(),
      });
    });

    const sponsorCount = await testDb.db.select({ count: sql<number>`count(*)` }).from(sponsors);
    expect(sponsorCount[0].count).toBe(2);

    const tripSponsorCount = await testDb.db
      .select({ count: sql<number>`count(*)` })
      .from(tripSponsors);
    expect(tripSponsorCount[0].count).toBe(1);
  });

  it("inserts sponsor via Drizzle ORM transaction", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);

    await testDb.db.transaction(async (tx) => {
      await tx.insert(sponsors).values({
        id: "sponsor-2",
        name: "New Sponsor",
        description: "New",
        logoPath: "/new.png",
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      });
    });

    const allSponsors = await testDb.db.select().from(sponsors);
    expect(allSponsors).toHaveLength(2);
    expect(allSponsors[1].name).toBe("New Sponsor");
  });

  it("inserts trip sponsor via Drizzle ORM transaction", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTrip("trip-1", "Summer Camp");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(tripSponsors).values({
        id: "ts-1",
        tripId: "trip-1",
        sponsorId: "sponsor-1",
        createdAt: now(),
      });
    });

    const allTripSponsors = await testDb.db.select().from(tripSponsors);
    expect(allTripSponsors).toHaveLength(1);
    expect(allTripSponsors[0].tripId).toBe("trip-1");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTrip("trip-1", "Summer Camp");

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(sponsors).values({
          id: "sponsor-2",
          name: "New Sponsor",
          description: "Desc",
          logoPath: "/logo2.png",
          isActive: true,
          createdAt: now(),
          updatedAt: now(),
        });
        await tx.insert(tripSponsors).values({
          id: "ts-1",
          tripId: "trip-1",
          sponsorId: "sponsor-2",
          createdAt: now(),
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const sponsorRows = await testDb.db.select().from(sponsors).where(eq(sponsors.id, "sponsor-2"));
    expect(sponsorRows).toHaveLength(0);

    const tripSponsorRows = await testDb.db
      .select()
      .from(tripSponsors)
      .where(eq(tripSponsors.id, "ts-1"));
    expect(tripSponsorRows).toHaveLength(0);
  });

  it("getAll returns active sponsors ordered by createdAt", async () => {
    await seedSponsor("sponsor-1", "Active Sponsor", true);
    await seedSponsor("sponsor-2", "Inactive Sponsor", false);

    const result = await getAll({ db: testDb.db });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Active Sponsor");
  });

  it("getById returns sponsor by id", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);

    const result = await getById({ db: testDb.db }, { id: "sponsor-1" });

    expect(result.id).toBe("sponsor-1");
    expect(result.name).toBe("Test Sponsor");
  });

  it("getById throws NOT_FOUND for missing sponsor", async () => {
    await expect(getById({ db: testDb.db }, { id: "missing" })).rejects.toThrow(
      "Sponsor not found",
    );
  });

  it("getByTripId returns active sponsors for a trip", async () => {
    await seedTrip("trip-1", "Summer Camp");
    await seedSponsor("sponsor-1", "Active Sponsor", true);
    await seedSponsor("sponsor-2", "Inactive Sponsor", false);
    await seedTripSponsor("ts-1", "trip-1", "sponsor-1");
    await seedTripSponsor("ts-2", "trip-1", "sponsor-2");

    const result = await getByTripId({ db: testDb.db }, { tripId: "trip-1" });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Active Sponsor");
  });

  it("create inserts a new sponsor", async () => {
    const result = await create(
      { db: testDb.db },
      {
        name: "New Sponsor",
        description: "Desc",
        logoPath: "/logo.png",
        isActive: true,
      },
    );

    expect(result.name).toBe("New Sponsor");

    const rows = await testDb.db.select().from(sponsors).where(eq(sponsors.id, result.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("New Sponsor");
  });

  it("update modifies existing sponsor", async () => {
    await seedSponsor("sponsor-1", "Old Name", true);

    const result = await update({ db: testDb.db }, { id: "sponsor-1", name: "Updated Name" });

    expect(result.name).toBe("Updated Name");

    const rows = await testDb.db.select().from(sponsors).where(eq(sponsors.id, "sponsor-1"));
    expect(rows[0].name).toBe("Updated Name");
  });

  it("update throws NOT_FOUND for missing sponsor", async () => {
    await expect(update({ db: testDb.db }, { id: "missing", name: "X" })).rejects.toThrow(
      "Sponsor not found",
    );
  });

  it("deleteSponsor removes a sponsor", async () => {
    await seedSponsor("sponsor-1", "To Delete", true);

    const result = await deleteSponsor({ db: testDb.db }, { id: "sponsor-1" });

    expect(result.id).toBe("sponsor-1");

    const rows = await testDb.db.select().from(sponsors).where(eq(sponsors.id, "sponsor-1"));
    expect(rows).toHaveLength(0);
  });

  it("addToTrip associates a sponsor with a trip", async () => {
    await seedTrip("trip-1", "Summer Camp");
    await seedSponsor("sponsor-1", "Test Sponsor", true);

    const result = await addToTrip({ db: testDb.db }, { tripId: "trip-1", sponsorId: "sponsor-1" });

    expect(result.tripId).toBe("trip-1");
    expect(result.sponsorId).toBe("sponsor-1");

    const rows = await testDb.db.select().from(tripSponsors).where(eq(tripSponsors.id, result.id));
    expect(rows).toHaveLength(1);
  });

  it("addToTrip throws NOT_FOUND for missing trip", async () => {
    await seedSponsor("sponsor-1", "Test Sponsor", true);

    await expect(
      addToTrip({ db: testDb.db }, { tripId: "missing", sponsorId: "sponsor-1" }),
    ).rejects.toThrow("Trip not found");
  });

  it("addToTrip throws NOT_FOUND for missing sponsor", async () => {
    await seedTrip("trip-1", "Summer Camp");

    await expect(
      addToTrip({ db: testDb.db }, { tripId: "trip-1", sponsorId: "missing" }),
    ).rejects.toThrow("Sponsor not found");
  });

  it("addToTrip throws CONFLICT for duplicate association", async () => {
    await seedTrip("trip-1", "Summer Camp");
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTripSponsor("ts-1", "trip-1", "sponsor-1");

    await expect(
      addToTrip({ db: testDb.db }, { tripId: "trip-1", sponsorId: "sponsor-1" }),
    ).rejects.toThrow("Sponsor is already associated with this trip");
  });

  it("removeFromTrip removes a sponsor from a trip", async () => {
    await seedTrip("trip-1", "Summer Camp");
    await seedSponsor("sponsor-1", "Test Sponsor", true);
    await seedTripSponsor("ts-1", "trip-1", "sponsor-1");

    const result = await removeFromTrip(
      { db: testDb.db },
      { tripId: "trip-1", sponsorId: "sponsor-1" },
    );

    expect(result.tripId).toBe("trip-1");
    expect(result.sponsorId).toBe("sponsor-1");

    const rows = await testDb.db.select().from(tripSponsors).where(eq(tripSponsors.id, "ts-1"));
    expect(rows).toHaveLength(0);
  });
});
