import {
  activityFeeds,
  challengeLocationMatch,
  challengeRecurrence,
  challenges,
  sponsors,
  tripParticipants,
  tripSponsors,
  trips,
  users,
} from "@mirai-app/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  createMockSupabase,
  seedGroup,
  seedParticipant,
  seedTrip,
  seedUser,
} from "../../../test-helpers";
import { getByIdFull } from "../trip/queries";

const TEST_TRIP_ID = "trip-1";

describe("trip.getByIdFull — PGLite integration", () => {
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

  async function seedSponsor(id: string, name: string) {
    await testDb.db.insert(sponsors).values({
      id,
      name,
      description: "desc",
      logoPath: "logo.png",
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    });
  }

  async function seedTripSponsor(id: string, tripId: string, sponsorId: string) {
    await testDb.db.insert(tripSponsors).values({ id, tripId, sponsorId, createdAt: now() });
  }

  async function seedChallenge(id: string, tripId: string, name: string) {
    await testDb.db.insert(challenges).values({
      id,
      tripId,
      name,
      description: "Challenge description",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      status: "VISIBLE",
      createdAt: now(),
      updatedAt: now(),
    });
    await testDb.db.insert(challengeRecurrence).values({
      challengeId: id,
      isRecurring: false,
      dailyStartTime: "",
      dailyEndTime: "",
      recurringDays: 0,
      type: "DAILY",
    });
    await testDb.db.insert(challengeLocationMatch).values({
      challengeId: id,
      targetLatitude: 0,
      targetLongitude: 0,
    });
  }

  async function seedActivityFeed(
    id: string,
    tripId: string,
    activityType: string,
    title: string,
    createdAt = now(),
    createdByAdmin = "user-1",
  ) {
    await testDb.db.insert(activityFeeds).values({
      id,
      tripId,
      activityType,
      title,
      description: "",
      imageUrl: "",
      createdByAdmin,
      createdAt,
      updatedAt: now(),
    });
  }

  function buildContext(userId: string, emails: Record<string, string> = {}) {
    return {
      db: testDb.db,
      dbUser: { id: userId, role: "USER" as const },
      supabase: createMockSupabase(emails),
    };
  }

  it("returns consolidated trip details for participants", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Winter Retreat", "Snow and cocoa");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Ski Team", "user-1", "SKI01");
    await seedParticipant(testDb.db, "tp-1", "user-1", TEST_TRIP_ID, "group-1");
    await seedParticipant(testDb.db, "tp-2", "user-2", TEST_TRIP_ID, "group-1");
    await seedSponsor("sponsor-1", "Active Sponsor");
    await seedTripSponsor("ts-1", TEST_TRIP_ID, "sponsor-1");
    await seedChallenge("challenge-1", TEST_TRIP_ID, "Photo Sprint");
    await seedActivityFeed(
      "af-1",
      TEST_TRIP_ID,
      "custom",
      "News A",
      new Date("2025-06-02T10:00:00Z"),
    );
    await seedActivityFeed(
      "af-2",
      TEST_TRIP_ID,
      "custom",
      "News B",
      new Date("2025-06-03T10:00:00Z"),
    );
    await seedActivityFeed(
      "af-3",
      TEST_TRIP_ID,
      "user_post",
      "Post A",
      new Date("2025-06-04T10:00:00Z"),
    );

    const result = await getByIdFull(
      buildContext("user-1", { "auth-1": "alice@example.com", "auth-2": "bob@example.com" }),
      { id: TEST_TRIP_ID },
    );

    expect(result.trip.id).toBe(TEST_TRIP_ID);
    expect(result.trip.name).toBe("Winter Retreat");
    expect(result.trip.groups).toHaveLength(1);
    expect(result.trip.participants).toHaveLength(2);
    expect(result.trip.tripSponsors).toHaveLength(1);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.id).toBe("group-1");
    expect(result.groups[0]?.name).toBe("Ski Team");

    expect(result.challenges).toHaveLength(1);
    expect(result.challenges[0]?.id).toBe("challenge-1");
    expect(result.challenges[0]?.name).toBe("Photo Sprint");

    expect(result.sponsors).toHaveLength(1);
    expect(result.sponsors[0]?.id).toBe("sponsor-1");
    expect(result.sponsors[0]?.name).toBe("Active Sponsor");

    expect(result.latestNews).toHaveLength(2);
    expect(result.latestNews.every((item) => item.activityType === "custom")).toBe(true);
    expect(result.latestNews[0].title).toBe("News B");
    expect(result.latestNews[1].title).toBe("News A");
    expect(result.latestNews[0].admin).toBeDefined();
  });

  it("returns empty consolidated sections when no groups, challenges, sponsors or news exist", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "empty-trip", "Empty Trip");
    await seedGroup(testDb.db, "group-empty", "empty-trip", "Lonely Group", "user-1", "EMPTY01");
    await seedParticipant(testDb.db, "tp-empty", "user-1", "empty-trip", "group-empty");

    const result = await getByIdFull(buildContext("user-1"), { id: "empty-trip" });

    expect(result.trip.id).toBe("empty-trip");
    expect(result.groups).toHaveLength(1);
    expect(result.challenges).toHaveLength(0);
    expect(result.sponsors).toHaveLength(0);
    expect(result.latestNews).toHaveLength(0);
  });

  it("throws FORBIDDEN for non-participants", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "secret-trip", "Secret Trip");

    await expect(getByIdFull(buildContext("user-1"), { id: "secret-trip" })).rejects.toThrow(
      "You are not a participant of this trip",
    );
  });

  it("propagates FORBIDDEN when trip does not exist (non-participant)", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");

    await expect(getByIdFull(buildContext("user-1"), { id: "missing-trip" })).rejects.toThrow(
      "You are not a participant of this trip",
    );
  });
});
