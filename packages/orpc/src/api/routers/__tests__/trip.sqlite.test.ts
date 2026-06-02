import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb } from "./helpers/trip-sqlite-db";
import { eq } from "drizzle-orm";
import { getAll, getById, getByIdAdmin, getResources } from "../trip/queries";
import { createTrip, updateTrip } from "../trip/mutations";
import { trips } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";

function createMockSupabase(emails: Record<string, string> = {}) {
  return {
    auth: {
      admin: {
        getUserById: async (authUserId: string) => ({
          data: { user: emails[authUserId] ? { email: emails[authUserId] } : null },
          error: null,
        }),
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "https://signed-url.example.com/image.jpg" }, error: null }),
      }),
    },
  };
}

describe("trip router — real SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;
  let originalCreatedAtDefault: unknown;
  const now = () => Date.now();

  beforeEach(() => {
    testDb = createTestDb();
    originalCreatedAtDefault = trips.createdAt.default;
    trips.createdAt.default = undefined;
    trips.createdAt.defaultFn = () => new Date();
  });

  afterEach(() => {
    trips.createdAt.default = originalCreatedAtDefault;
    trips.createdAt.defaultFn = undefined;
    testDb.db.close();
  });

  async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
    await testDb.drizzleDb.insert(testDb.sqliteUsers).values({ id, authUserId, firstName, lastName, createdAt: new Date(now()), updatedAt: new Date(now()) });
  }

  async function seedTrip(id: string, name: string, description?: string) {
    await testDb.drizzleDb.insert(testDb.sqliteTrips).values({
      id, name, description,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: new Date(now()),
      updatedAt: new Date(now()),
    });
  }

  async function seedGroup(id: string, tripId: string, name: string, organizerId: string, code: string) {
    await testDb.drizzleDb.insert(testDb.sqliteGroups).values({ id, tripId, name, organizerId, code, createdAt: new Date(now()), updatedAt: new Date(now()) });
  }

  async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
    await testDb.drizzleDb.insert(testDb.sqliteTripParticipants).values({ id, userId, tripId, groupId, createdAt: new Date(now()), updatedAt: new Date(now()) });
  }

  async function seedSponsor(id: string, name: string, isActive: boolean) {
    await testDb.drizzleDb.insert(testDb.sqliteSponsors).values({ id, name, description: "desc", logoPath: "logo.png", isActive, createdAt: new Date(now()), updatedAt: new Date(now()) });
  }

  async function seedTripSponsor(id: string, tripId: string, sponsorId: string) {
    await testDb.drizzleDb.insert(testDb.sqliteTripSponsors).values({ id, tripId, sponsorId, createdAt: new Date(now()) });
  }

  it("getAll returns paginated trips with groups and active sponsors", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Summer Camp", "Fun in the sun");
    await seedParticipant("tp-1", "user-1", "trip-1");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedSponsor("sponsor-1", "Active Sponsor", true);
    await seedSponsor("sponsor-2", "Inactive Sponsor", false);
    await seedTripSponsor("ts-1", "trip-1", "sponsor-1");
    await seedTripSponsor("ts-2", "trip-1", "sponsor-2");

    const result = await getAll({ db: testDb.drizzleDb as unknown as DB, dbUser: { id: "user-1" } }, { pagination: { limit: 10, offset: 0 } });

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
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedTrip("trip-1", "Winter Retreat", "Snow and cocoa");
    await seedGroup("group-1", "trip-1", "Ski Team", "user-1", "SKI01");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedParticipant("tp-2", "user-2", "trip-1", "group-1");

    const result = await getById(
      { db: testDb.drizzleDb as unknown as DB, dbUser: { id: "user-1" }, supabase: createMockSupabase({ "auth-1": "alice@example.com", "auth-2": "bob@example.com" }) },
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
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Secret Trip");

    await expect(
      getById({ db: testDb.drizzleDb as unknown as DB, dbUser: { id: "user-1" }, supabase: createMockSupabase() }, { id: "trip-1" }),
    ).rejects.toThrow("You are not a participant of this trip");
  });

  it("getByIdAdmin skips participant check and produces identical shaping to getById", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Admin View Trip", "Visible to admins");
    await seedGroup("group-1", "trip-1", "Admin Group", "user-1", "ADMIN01");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");

    const supabase = createMockSupabase({ "auth-1": "alice@example.com" });
    const adminResult = await getByIdAdmin({ db: testDb.drizzleDb as unknown as DB, supabase }, { id: "trip-1" });
    const participantResult = await getById({ db: testDb.drizzleDb as unknown as DB, dbUser: { id: "user-1" }, supabase }, { id: "trip-1" });

    expect(adminResult.id).toBe(participantResult.id);
    expect(adminResult.name).toBe(participantResult.name);
    expect(adminResult.groups).toHaveLength(participantResult.groups.length);
    expect(adminResult.groups[0]._count.participants).toBe(participantResult.groups[0]._count.participants);
    expect(adminResult.participants).toHaveLength(participantResult.participants.length);
    expect(adminResult.participants[0].user.email).toBe(participantResult.participants[0].user.email);
  });

  it("getResources returns sorted resources and insurance steps", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Resource Trip");
    await seedParticipant("tp-1", "user-1", "trip-1");
    await testDb.drizzleDb.insert(testDb.sqliteTripResources).values([
      { id: "res-3", tripId: "trip-1", type: "LINK", label: "Third", sortOrder: 3, createdAt: new Date(now()), updatedAt: new Date(now()) },
      { id: "res-1", tripId: "trip-1", type: "LINK", label: "First", sortOrder: 1, createdAt: new Date(now()), updatedAt: new Date(now()) },
      { id: "res-2", tripId: "trip-1", type: "LINK", label: "Second", sortOrder: 2, createdAt: new Date(now()), updatedAt: new Date(now()) },
    ]);
    await testDb.drizzleDb.insert(testDb.sqliteTripInsurances).values({
      id: "ins-1", tripId: "trip-1", label: "Travel Insurance", phoneNumber: "+1234567890", phoneDisplay: "+1 234 567 890",
      policyNumber: "POL-123", contractNumber: "CTR-456", providerName: "InsureCo", createdAt: new Date(now()), updatedAt: new Date(now()),
    });
    await testDb.drizzleDb.insert(testDb.sqliteTripInsuranceSteps).values([
      { id: "step-2", insuranceId: "ins-1", stepNumber: 2, title: "Call provider", text: "Dial the number", createdAt: new Date(now()), updatedAt: new Date(now()) },
      { id: "step-1", insuranceId: "ins-1", stepNumber: 1, title: "Find policy", text: "Locate your policy doc", createdAt: new Date(now()), updatedAt: new Date(now()) },
    ]);

    const result = await getResources({ db: testDb.drizzleDb as unknown as DB, dbUser: { id: "user-1" } }, { tripId: "trip-1" });

    expect(result.resources).toHaveLength(3);
    expect(result.resources.map((r) => r.label)).toEqual(["First", "Second", "Third"]);
    expect(result.insurance).toBeDefined();
    expect(result.insurance.steps.map((s) => s.title)).toEqual(["Find policy", "Call provider"]);
  });

  it("createTrip inserts a new trip with relations", async () => {
    const result = await createTrip({ db: testDb.drizzleDb as unknown as DB }, {
      name: "New Adventure",
      description: "An exciting new trip",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-09-10"),
      backgroundImagePath: "images/trips/adventure.jpg",
    });

    expect(result.name).toBe("New Adventure");
    expect(result.backgroundImagePath).toBe("images/trips/adventure.jpg");

    const rows = await testDb.drizzleDb.select().from(testDb.sqliteTrips).where(eq(testDb.sqliteTrips.id, result.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("New Adventure");
  });

  it("updateTrip modifies existing trip fields", async () => {
    await seedTrip("trip-1", "Old Name", "Old description");

    const result = await updateTrip({ db: testDb.drizzleDb as unknown as DB }, { id: "trip-1", name: "Updated Name", description: "Updated description" });

    expect(result.name).toBe("Updated Name");
    expect(result.description).toBe("Updated description");

    const rows = await testDb.drizzleDb.select().from(testDb.sqliteTrips).where(eq(testDb.sqliteTrips.id, "trip-1"));
    expect(rows[0].name).toBe("Updated Name");
    expect(rows[0].description).toBe("Updated description");
  });
});
