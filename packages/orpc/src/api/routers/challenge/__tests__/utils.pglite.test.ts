import {
  challengeLocationMatch,
  challengeQrCode,
  challengeRecurrence,
  challenges,
  challengeText,
  trips,
} from "@mirai-app/db";
import { desc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  activateVisibleChallenges,
  fetchChallengesWithRelations,
  fetchChallengeWithRelations,
  resolveChallengeImage,
  resolveChallengeImages,
  toClientChallenge,
} from "../utils";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

const mockSupabase = {
  storage: {
    from: (bucket: string) => ({
      createSignedUrl: async (path: string, _expiresIn: number) => ({
        data: { signedUrl: `https://example.com/${bucket}/${path}` },
        error: null as unknown,
      }),
    }),
  },
};

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

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

type ChallengeSeed = Partial<typeof challenges.$inferInsert> & {
  isRecurring?: boolean;
  dailyStartTime?: string;
  dailyEndTime?: string;
  recurringDays?: number;
  targetLatitude?: number;
  targetLongitude?: number;
  textExpectedPhrase?: string | null;
  qrCodeValue?: string | null;
};

async function seedChallenge(id: string, tripId: string, overrides: ChallengeSeed = {}) {
  await testDb.db.insert(challenges).values({
    id,
    tripId,
    name: overrides.name ?? "Test Challenge",
    description: overrides.description ?? "",
    submissionType: overrides.submissionType ?? "IMAGE",
    scoringCategory: overrides.scoringCategory ?? "SPEED",
    status: overrides.status ?? "HIDDEN",
    basePoints: overrides.basePoints ?? 100,
    autoApprove: overrides.autoApprove ?? false,
    startTime: overrides.startTime ?? null,
    endTime: overrides.endTime ?? null,
    votingStartTime: overrides.votingStartTime ?? null,
    votingEndTime: overrides.votingEndTime ?? null,
    createdAt: overrides.createdAt ?? now(),
    updatedAt: overrides.updatedAt ?? now(),
  });

  await testDb.db.insert(challengeRecurrence).values({
    challengeId: id,
    isRecurring: overrides.isRecurring ?? false,
    dailyStartTime: overrides.dailyStartTime ?? "",
    dailyEndTime: overrides.dailyEndTime ?? "",
    recurringDays: overrides.recurringDays ?? 0,
    type: "DAILY",
  });

  await testDb.db.insert(challengeLocationMatch).values({
    challengeId: id,
    targetLatitude: overrides.targetLatitude ?? 0,
    targetLongitude: overrides.targetLongitude ?? 0,
  });

  if (overrides.textExpectedPhrase !== undefined && overrides.textExpectedPhrase !== null) {
    await testDb.db.insert(challengeText).values({
      challengeId: id,
      expectedPhrase: overrides.textExpectedPhrase,
    });
  }

  if (overrides.qrCodeValue !== undefined && overrides.qrCodeValue !== null) {
    await testDb.db.insert(challengeQrCode).values({
      challengeId: id,
      expectedValue: overrides.qrCodeValue,
    });
  }
}

describe("toClientChallenge", () => {
  it("normalizes all null fields to defaults", () => {
    const result = toClientChallenge({
      id: "c1",
      description: null,
      textExpectedPhrase: null,
      qrCodeValue: null,
      image: null,
      dailyStartTime: null,
      dailyEndTime: null,
      targetLatitude: null,
      targetLongitude: null,
      basePoints: null,
      firstPlacePoints: null,
      secondPlacePoints: null,
      thirdPlacePoints: null,
      autoApprove: null,
      isRecurring: null,
    });

    expect(result.description).toBe("");
    expect(result.textExpectedPhrase).toBe("");
    expect(result.qrCodeValue).toBe("");
    expect(result.image).toBe("");
    expect(result.dailyStartTime).toBe("");
    expect(result.dailyEndTime).toBe("");
    expect(result.targetLatitude).toBe(0);
    expect(result.targetLongitude).toBe(0);
    expect(result.basePoints).toBe(0);
    expect(result.firstPlacePoints).toBe(0);
    expect(result.secondPlacePoints).toBe(0);
    expect(result.thirdPlacePoints).toBe(0);
    expect(result.autoApprove).toBe(false);
    expect(result.isRecurring).toBe(false);
  });

  it("preserves defined field values", () => {
    const result = toClientChallenge({
      id: "c1",
      description: "A challenge",
      textExpectedPhrase: "phrase",
      qrCodeValue: "qr",
      image: "img.jpg",
      dailyStartTime: "09:00",
      dailyEndTime: "18:00",
      targetLatitude: 52.5,
      targetLongitude: 13.4,
      basePoints: 50,
      firstPlacePoints: 30,
      secondPlacePoints: 20,
      thirdPlacePoints: 10,
      autoApprove: true,
      isRecurring: true,
    });

    expect(result.description).toBe("A challenge");
    expect(result.textExpectedPhrase).toBe("phrase");
    expect(result.qrCodeValue).toBe("qr");
    expect(result.image).toBe("img.jpg");
    expect(result.dailyStartTime).toBe("09:00");
    expect(result.dailyEndTime).toBe("18:00");
    expect(result.targetLatitude).toBe(52.5);
    expect(result.targetLongitude).toBe(13.4);
    expect(result.basePoints).toBe(50);
    expect(result.firstPlacePoints).toBe(30);
    expect(result.secondPlacePoints).toBe(20);
    expect(result.thirdPlacePoints).toBe(10);
    expect(result.autoApprove).toBe(true);
    expect(result.isRecurring).toBe(true);
  });
});

describe("fetchChallengesWithRelations", () => {
  beforeEach(async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedChallenge("c1", "trip-1", { name: "Challenge 1", createdAt: new Date("2025-01-01") });
    await seedChallenge("c2", "trip-1", { name: "Challenge 2", createdAt: new Date("2025-01-02") });
    await seedChallenge("c3", "trip-1", { name: "Challenge 3", createdAt: new Date("2025-01-03") });
  });

  it("returns all challenges when no orderBy/limit/offset provided (covers falsy branches 107-109)", async () => {
    const rows = await fetchChallengesWithRelations(testDb.db, undefined);
    expect(rows).toHaveLength(3);
  });

  it("returns challenges ordered by orderBy (covers line 107 truthy)", async () => {
    const rows = await fetchChallengesWithRelations(
      testDb.db,
      undefined,
      desc(challenges.createdAt),
    );
    expect(rows).toHaveLength(3);
    expect(rows[0].name).toBe("Challenge 3");
    expect(rows[2].name).toBe("Challenge 1");
  });

  it("returns limited challenges when limit provided without orderBy (covers line 108 truthy)", async () => {
    const rows = await fetchChallengesWithRelations(testDb.db, undefined, undefined, 2);
    expect(rows).toHaveLength(2);
  });

  it("returns challenges with offset when offset provided without orderBy/limit (covers line 109 truthy)", async () => {
    const rows = await fetchChallengesWithRelations(testDb.db, undefined, undefined, undefined, 0);
    expect(rows).toHaveLength(3);
  });

  it("returns challenges filtered by where clause", async () => {
    const rows = await fetchChallengesWithRelations(testDb.db, eq(challenges.id, "c2"));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Challenge 2");
  });
});

describe("fetchChallengeWithRelations", () => {
  beforeEach(async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedChallenge("c1", "trip-1", { name: "Challenge 1" });
  });

  it("returns a single challenge by id", async () => {
    const row = await fetchChallengeWithRelations(testDb.db, eq(challenges.id, "c1"));
    expect(row).not.toBeNull();
    expect(row?.id).toBe("c1");
    expect(row?.name).toBe("Challenge 1");
  });

  it("returns null when challenge not found", async () => {
    const row = await fetchChallengeWithRelations(testDb.db, eq(challenges.id, "nonexistent"));
    expect(row).toBeNull();
  });
});

describe("activateVisibleChallenges", () => {
  beforeEach(async () => {
    await seedTrip("trip-1", "Test Trip");
    await seedTrip("trip-2", "Test Trip 2");

    await seedChallenge("c-visible", "trip-1", {
      name: "Visible Challenge",
      status: "VISIBLE",
      scoringCategory: "SPEED",
      startTime: new Date(now().getTime() - 120_000),
      endTime: new Date(now().getTime() - 60_000),
    });
    await seedChallenge("c-active", "trip-1", {
      name: "Active Challenge",
      status: "ACTIVE",
      scoringCategory: "SPEED",
      startTime: new Date(now().getTime() - 120_000),
      endTime: new Date(now().getTime() - 60_000),
    });
    await seedChallenge("c-visible-trip2", "trip-2", {
      name: "Visible Trip2",
      status: "VISIBLE",
      scoringCategory: "SPEED",
      startTime: new Date(now().getTime() - 120_000),
      endTime: new Date(now().getTime() - 60_000),
    });
  });

  it("activates/completes challenges with no where filter (covers falsy branches 129-130, 154-155)", async () => {
    await activateVisibleChallenges(testDb.db);

    const visibleAfter = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible"));
    expect(visibleAfter[0].status).toBe("COMPLETED");
  });

  it("filters by where.id (covers truthy branches 129, 154)", async () => {
    await activateVisibleChallenges(testDb.db, { id: "c-visible" });

    const targetAfter = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible"));
    expect(targetAfter[0].status).toBe("COMPLETED");

    const otherAfter = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible-trip2"));
    expect(otherAfter[0].status).toBe("VISIBLE");
  });

  it("filters by where.tripId (covers truthy branches 130, 155)", async () => {
    await activateVisibleChallenges(testDb.db, { tripId: "trip-1" });

    const trip1After = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible"));
    expect(trip1After[0].status).toBe("COMPLETED");

    const trip2After = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible-trip2"));
    expect(trip2After[0].status).toBe("VISIBLE");
  });

  it("filters by both where.id and where.tripId", async () => {
    await activateVisibleChallenges(testDb.db, { id: "c-visible", tripId: "trip-1" });

    const targetAfter = await testDb.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, "c-visible"));
    expect(targetAfter[0].status).toBe("COMPLETED");
  });
});

describe("resolveChallengeImage", () => {
  it("returns null for null path", async () => {
    const result = await resolveChallengeImage(mockSupabase, null);
    expect(result).toBeNull();
  });

  it("returns null for undefined path", async () => {
    const result = await resolveChallengeImage(mockSupabase, undefined);
    expect(result).toBeNull();
  });

  it("returns signed url for valid challenge image path", async () => {
    const result = await resolveChallengeImage(mockSupabase, "challenge/submission.jpg");
    expect(result).toBe("https://example.com/images/challenge/submission.jpg");
  });

  it("returns signed url for challenge video path", async () => {
    const result = await resolveChallengeImage(mockSupabase, "challenge/clip.mp4");
    expect(result).toBe("https://example.com/videos/challenge/clip.mp4");
  });

  it("returns original path for unknown bucket prefix", async () => {
    const result = await resolveChallengeImage(mockSupabase, "unknown/path/here.jpg");
    expect(result).toBe("unknown/path/here.jpg");
  });
});

describe("resolveChallengeImages", () => {
  it("returns empty array for empty input", async () => {
    const result = await resolveChallengeImages(mockSupabase, []);
    expect(result).toEqual([]);
  });

  it("resolves images for multiple challenges", async () => {
    const result = await resolveChallengeImages(mockSupabase, [
      { id: "c1", image: "challenge/submission.jpg" },
      { id: "c2", image: null },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].image).toBe("https://example.com/images/challenge/submission.jpg");
    expect(result[1].image).toBeNull();
  });
});
