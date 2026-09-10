import { sponsors, tripSponsorDisplay, tripSponsors, trips } from "@mirai-app/db";
import { and, eq, sql } from "drizzle-orm";
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

  // Regression: migration 20260605202256_freezing_venom moved height/offsetX/offsetY
  // from `sponsors` to `trip_sponsor_display`, but the router kept accepting them and
  // spread them into the sponsors insert, where they were silently dropped.
  describe("per-trip display settings", () => {
    async function readDisplay(tripId: string, sponsorId: string) {
      const [row] = await testDb.db
        .select()
        .from(tripSponsorDisplay)
        .where(
          and(eq(tripSponsorDisplay.tripId, tripId), eq(tripSponsorDisplay.sponsorId, sponsorId)),
        );
      return row;
    }

    it("create persists height and offsets to trip_sponsor_display", async () => {
      await seedTrip("trip-1", "Summer Camp");

      const result = await create(
        { db: testDb.db },
        {
          name: "Netcompany",
          description: "Partner",
          logoPath: "images/sponsors/netcompany.png",
          isActive: true,
          tripId: "trip-1",
          height: 22,
          offsetX: 3,
          offsetY: -5,
        },
      );

      expect(result.display).toMatchObject({ height: 22, offsetX: 3, offsetY: -5 });

      const stored = await readDisplay("trip-1", result.id);
      expect(stored).toMatchObject({ height: 22, offsetX: 3, offsetY: -5 });
    });

    it("create associates the sponsor with the trip when tripId is given", async () => {
      await seedTrip("trip-1", "Summer Camp");

      const result = await create(
        { db: testDb.db },
        {
          name: "Netcompany",
          description: "Partner",
          logoPath: "images/sponsors/netcompany.png",
          isActive: true,
          tripId: "trip-1",
          height: 22,
        },
      );

      const visible = await getByTripId({ db: testDb.db }, { tripId: "trip-1" });
      expect(visible.map((s) => s.id)).toContain(result.id);
    });

    it("create rejects display settings without a tripId instead of dropping them", async () => {
      await expect(
        create(
          { db: testDb.db },
          {
            name: "Netcompany",
            description: "Partner",
            logoPath: "images/sponsors/netcompany.png",
            isActive: true,
            height: 22,
          },
        ),
      ).rejects.toThrow(/require a tripId/);

      const rows = await testDb.db.select().from(sponsors);
      expect(rows).toHaveLength(0);
    });

    it("create throws NOT_FOUND when the trip does not exist", async () => {
      await expect(
        create(
          { db: testDb.db },
          {
            name: "Netcompany",
            description: "Partner",
            logoPath: "images/sponsors/netcompany.png",
            isActive: true,
            tripId: "missing",
            height: 22,
          },
        ),
      ).rejects.toThrow("Trip not found");

      const rows = await testDb.db.select().from(sponsors);
      expect(rows).toHaveLength(0);
    });

    it("create without a tripId leaves the sponsor unassociated and without display", async () => {
      const result = await create(
        { db: testDb.db },
        {
          name: "Netcompany",
          description: "Partner",
          logoPath: "images/sponsors/netcompany.png",
          isActive: true,
        },
      );

      expect(result.display).toBeNull();

      const displayRows = await testDb.db.select().from(tripSponsorDisplay);
      expect(displayRows).toHaveLength(0);
    });

    // Regression: create used to upsert trip_sponsor_display unconditionally, so
    // "add this sponsor to this trip with the default layout" built an empty
    // `set` and blew up with a raw Drizzle Error("No values to set") — after the
    // sponsor and the association had already been written.
    it("create with a tripId but no display settings associates the sponsor and skips the display row", async () => {
      await seedTrip("trip-1", "Summer Camp");

      const result = await create(
        { db: testDb.db },
        {
          name: "Netcompany",
          description: "Partner",
          logoPath: "images/sponsors/netcompany.png",
          isActive: true,
          tripId: "trip-1",
        },
      );

      expect(result.display).toBeNull();

      const visible = await getByTripId({ db: testDb.db }, { tripId: "trip-1" });
      expect(visible.map((s) => s.id)).toEqual([result.id]);

      const displayRows = await testDb.db.select().from(tripSponsorDisplay);
      expect(displayRows).toHaveLength(0);
    });

    // The default layout must stay reachable: creating the same sponsor twice
    // used to be the only way out of the crash above, and it duplicated rows.
    it("create with a tripId but no display settings can be called twice without leftovers", async () => {
      await seedTrip("trip-1", "Summer Camp");

      const input = {
        name: "Netcompany",
        description: "Partner",
        logoPath: "images/sponsors/netcompany.png",
        isActive: true,
        tripId: "trip-1",
      };

      const first = await create({ db: testDb.db }, input);
      const second = await create({ db: testDb.db }, { ...input, name: "Netcompany PL" });

      expect(second.id).not.toBe(first.id);

      const associations = await testDb.db
        .select()
        .from(tripSponsors)
        .where(eq(tripSponsors.tripId, "trip-1"));
      expect(associations).toHaveLength(2);
    });

    it("create rolls the sponsor and the association back when the display write fails", async () => {
      await seedTrip("trip-1", "Summer Camp");

      await expect(
        create(
          { db: testDb.db },
          {
            name: "Netcompany",
            description: "Partner",
            logoPath: "images/sponsors/netcompany.png",
            isActive: true,
            tripId: "trip-1",
            // Out of range for a Postgres `integer`, so the display insert fails
            // after the sponsor and the association have been written.
            height: 2_147_483_648,
          },
        ),
      ).rejects.toThrow();

      expect(await testDb.db.select().from(sponsors)).toHaveLength(0);
      expect(await testDb.db.select().from(tripSponsors)).toHaveLength(0);
      expect(await testDb.db.select().from(tripSponsorDisplay)).toHaveLength(0);
    });

    it("update persists height and offsets to trip_sponsor_display", async () => {
      await seedTrip("trip-1", "Summer Camp");
      await seedSponsor("sponsor-1", "Netcompany", true);
      await seedTripSponsor("ts-1", "trip-1", "sponsor-1");

      const result = await update(
        { db: testDb.db },
        { id: "sponsor-1", tripId: "trip-1", height: 22, offsetX: 1, offsetY: 2 },
      );

      expect(result.display).toMatchObject({ height: 22, offsetX: 1, offsetY: 2 });
      expect(await readDisplay("trip-1", "sponsor-1")).toMatchObject({
        height: 22,
        offsetX: 1,
        offsetY: 2,
      });
    });

    it("update only overwrites the display fields that were sent", async () => {
      await seedTrip("trip-1", "Summer Camp");
      await seedSponsor("sponsor-1", "Netcompany", true);
      await testDb.db.insert(tripSponsorDisplay).values({
        id: "tsd-1",
        tripId: "trip-1",
        sponsorId: "sponsor-1",
        height: 30,
        offsetX: 7,
        offsetY: 9,
      });

      await update({ db: testDb.db }, { id: "sponsor-1", tripId: "trip-1", height: 18 });

      expect(await readDisplay("trip-1", "sponsor-1")).toMatchObject({
        height: 18,
        offsetX: 7,
        offsetY: 9,
      });
    });

    it("update accepts display settings alone without touching sponsor columns", async () => {
      await seedTrip("trip-1", "Summer Camp");
      await seedSponsor("sponsor-1", "Netcompany", true);

      const result = await update(
        { db: testDb.db },
        { id: "sponsor-1", tripId: "trip-1", height: 18 },
      );

      expect(result.name).toBe("Netcompany");
    });

    it("update rejects display settings without a tripId instead of dropping them", async () => {
      await seedSponsor("sponsor-1", "Netcompany", true);

      await expect(update({ db: testDb.db }, { id: "sponsor-1", height: 22 })).rejects.toThrow(
        /require a tripId/,
      );
    });

    it("update throws NOT_FOUND when the trip does not exist", async () => {
      await seedSponsor("sponsor-1", "Netcompany", true);

      await expect(
        update({ db: testDb.db }, { id: "sponsor-1", tripId: "missing", height: 22 }),
      ).rejects.toThrow("Trip not found");
    });

    it("update without display settings leaves trip_sponsor_display untouched", async () => {
      await seedSponsor("sponsor-1", "Old Name", true);

      const result = await update({ db: testDb.db }, { id: "sponsor-1", name: "New Name" });

      expect(result.name).toBe("New Name");
      expect(result.display).toBeNull();
      expect(await testDb.db.select().from(tripSponsorDisplay)).toHaveLength(0);
    });
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
