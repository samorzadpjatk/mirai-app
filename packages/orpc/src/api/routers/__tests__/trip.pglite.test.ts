import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { eq } from "drizzle-orm";
import { getAll, getById, getByIdAdmin, getResources } from "../trip/queries";
import { createTrip, updateTrip } from "../trip/mutations";
import {
  trips,
  users,
  tripParticipants,
  groups,
  sponsors,
  tripSponsors,
  tripResources,
  tripInsurances,
  tripInsuranceSteps,
} from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import {
  createMockSupabase,
  seedUser,
  seedTrip,
  seedGroup,
  seedParticipant,
} from "../../../test-helpers";

describe("trip router — PGLite integration", () => {
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
      description: "desc",
      logoPath: "logo.png",
      isActive,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTripSponsor(id: string, tripId: string, sponsorId: string) {
    await testDb.db.insert(tripSponsors).values({ id, tripId, sponsorId, createdAt: now() });
  }

  it("getAll returns paginated trips with groups and active sponsors", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Summer Camp", "Fun in the sun");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");
    await seedGroup(testDb.db, "group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedSponsor("sponsor-1", "Active Sponsor", true);
    await seedSponsor("sponsor-2", "Inactive Sponsor", false);
    await seedTripSponsor("ts-1", "trip-1", "sponsor-1");
    await seedTripSponsor("ts-2", "trip-1", "sponsor-2");

    // No more as unknown as DB! PGLite uses the same schema as production
    const result = await getAll(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { pagination: { limit: 10, offset: 0 } },
    );

    expect(result.trips).toHaveLength(1);
    expect(result.trips[0].name).toBe("Summer Camp");
    expect(result.trips[0].groups).toHaveLength(1);
    expect(result.trips[0].groups[0].name).toBe("Team A");
    expect(result.trips[0].tripSponsors).toHaveLength(1);
    expect(result.trips[0].tripSponsors[0].sponsor.name).toBe("Active Sponsor");
    expect(result.pagination.total).toBe(1);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("getById enforces participant check and returns shaped data", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, "trip-1", "Winter Retreat", "Snow and cocoa");
    await seedGroup(testDb.db, "group-1", "trip-1", "Ski Team", "user-1", "SKI01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", "trip-1", "group-1");

    const result = await getById(
      {
        db: testDb.db,
        dbUser: { id: "user-1" },
        supabase: createMockSupabase({
          "auth-1": "alice@example.com",
          "auth-2": "bob@example.com",
        }),
      },
      { id: "trip-1" },
    );

    expect(result.id).toBe("trip-1");
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]._count.participants).toBe(2);
    expect(result.participants).toHaveLength(2);
    expect(result.participants.find((p) => p.user.firstName === "Alice")).toBeDefined();
    expect(result.participants.find((p) => p.user.firstName === "Bob")).toBeDefined();
  });

  it("getById throws FORBIDDEN for non-participants", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Secret Trip");

    await expect(
      getById(
        { db: testDb.db, dbUser: { id: "user-1" }, supabase: createMockSupabase() },
        { id: "trip-1" },
      ),
    ).rejects.toThrow("You are not a participant of this trip");
  });

  it("getByIdAdmin skips participant check and produces identical shaping to getById", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Admin View Trip", "Visible to admins");
    await seedGroup(testDb.db, "group-1", "trip-1", "Admin Group", "user-1", "ADMIN01");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1", "group-1");

    const supabase = createMockSupabase({ "auth-1": "alice@example.com" });
    const adminResult = await getByIdAdmin({ db: testDb.db, supabase }, { id: "trip-1" });
    const participantResult = await getById(
      { db: testDb.db, dbUser: { id: "user-1" }, supabase },
      { id: "trip-1" },
    );

    expect(adminResult.id).toBe(participantResult.id);
    expect(adminResult.name).toBe(participantResult.name);
    expect(adminResult.groups).toHaveLength(participantResult.groups.length);
    expect(adminResult.groups[0]._count.participants).toBe(
      participantResult.groups[0]._count.participants,
    );
    expect(adminResult.participants).toHaveLength(participantResult.participants.length);
    expect(adminResult.participants[0].user.email).toBe(
      participantResult.participants[0].user.email,
    );
  });

  it("createTrip inserts a new trip with relations", async () => {
    const result = await createTrip(
      { db: testDb.db },
      {
        name: "New Adventure",
        description: "An exciting new trip",
        startDate: new Date("2025-09-01"),
        endDate: new Date("2025-09-10"),
        backgroundImagePath: "images/trips/adventure.jpg",
      },
    );

    expect(result.name).toBe("New Adventure");
    expect(result.backgroundImagePath).toBe("images/trips/adventure.jpg");

    const rows = await testDb.db.select().from(trips).where(eq(trips.id, result.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("New Adventure");
  });

  it("updateTrip modifies existing trip fields", async () => {
    await seedTrip(testDb.db, "trip-1", "Old Name", "Old description");

    const result = await updateTrip(
      { db: testDb.db },
      { id: "trip-1", name: "Updated Name", description: "Updated description" },
    );

    expect(result.name).toBe("Updated Name");
    expect(result.description).toBe("Updated description");

    const rows = await testDb.db.select().from(trips).where(eq(trips.id, "trip-1"));
    expect(rows[0].name).toBe("Updated Name");
    expect(rows[0].description).toBe("Updated description");
  });

  it("getResources returns sorted resources and insurance steps", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "trip-1", "Resource Trip");
    await seedParticipant(testDb.db, "tp-1", "user-1", "trip-1");
    await testDb.db.insert(tripResources).values([
      {
        id: "res-3",
        tripId: "trip-1",
        type: "LINK",
        label: "Third",
        sortOrder: 3,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "res-1",
        tripId: "trip-1",
        type: "LINK",
        label: "First",
        sortOrder: 1,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "res-2",
        tripId: "trip-1",
        type: "LINK",
        label: "Second",
        sortOrder: 2,
        createdAt: now(),
        updatedAt: now(),
      },
    ]);
    await testDb.db.insert(tripInsurances).values({
      id: "ins-1",
      tripId: "trip-1",
      label: "Travel Insurance",
      phoneNumber: "+1234567890",
      phoneDisplay: "+1 234 567 890",
      policyNumber: "POL-123",
      contractNumber: "CTR-456",
      providerName: "InsureCo",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(tripInsuranceSteps).values([
      {
        id: "step-2",
        insuranceId: "ins-1",
        stepNumber: 2,
        title: "Call provider",
        text: "Dial the number",
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: "step-1",
        insuranceId: "ins-1",
        stepNumber: 1,
        title: "Find policy",
        text: "Locate your policy doc",
        createdAt: now(),
        updatedAt: now(),
      },
    ]);

    const result = await getResources(
      { db: testDb.db, dbUser: { id: "user-1" } },
      { tripId: "trip-1" },
    );

    expect(result.resources).toHaveLength(3);
    expect(result.resources.map((r) => r.label)).toEqual(["First", "Second", "Third"]);
    expect(result.insurance).toBeDefined();
    expect(result.insurance.steps.map((s) => s.title)).toEqual(["Find policy", "Call provider"]);
  });
});
