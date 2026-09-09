import { trips } from "@mirai-app/db";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import { seedGroup, seedParticipant, seedTrip, seedUser } from "../../../test-helpers";
import { getTheme } from "../trip/queries";

const TEST_TRIP_ID = "trip-1";

describe("trip.getTheme — PGLite integration", () => {
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  function buildContext(userId: string) {
    return {
      db: testDb.db,
      dbUser: { id: userId },
    };
  }

  async function seedParticipantTrip(theme?: string) {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, TEST_TRIP_ID, "Winter Retreat");
    await seedGroup(testDb.db, "group-1", TEST_TRIP_ID, "Ski Team", "user-1", "SKI01");
    await seedParticipant(testDb.db, "tp-1", "user-1", TEST_TRIP_ID, "group-1");

    if (theme) {
      await testDb.db.update(trips).set({ theme }).where(eq(trips.id, TEST_TRIP_ID));
    }
  }

  it("returns the trip theme for a participant", async () => {
    await seedParticipantTrip("PIRATE");

    await expect(getTheme(buildContext("user-1"), { id: TEST_TRIP_ID })).resolves.toEqual({
      theme: "PIRATE",
    });
  });

  it("falls back to DEFAULT when the trip has no explicit theme", async () => {
    await seedParticipantTrip();

    await expect(getTheme(buildContext("user-1"), { id: TEST_TRIP_ID })).resolves.toEqual({
      theme: "DEFAULT",
    });
  });

  it("throws FORBIDDEN for non-participants", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");
    await seedTrip(testDb.db, "secret-trip", "Secret Trip");

    await expect(getTheme(buildContext("user-1"), { id: "secret-trip" })).rejects.toThrow(
      "You are not a participant of this trip",
    );
  });

  it("throws FORBIDDEN when the trip does not exist", async () => {
    await seedUser(testDb.db, "user-1", "auth-1", "Alice", "Smith");

    await expect(getTheme(buildContext("user-1"), { id: "missing-trip" })).rejects.toThrow(
      "You are not a participant of this trip",
    );
  });

  it("does not leak another participant's trip theme", async () => {
    await seedParticipantTrip("PIRATE");
    await seedUser(testDb.db, "user-2", "auth-2", "Bob", "Jones");

    await expect(getTheme(buildContext("user-2"), { id: TEST_TRIP_ID })).rejects.toThrow(
      "You are not a participant of this trip",
    );
  });
});
