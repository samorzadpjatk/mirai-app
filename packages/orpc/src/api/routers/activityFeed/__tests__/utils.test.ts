import type { DB } from "@mirai-app/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createPgliteTestDb } from "~/db-test-helper";
import {
  ensureTripExists,
  ensureTripParticipant,
  imageReferenceSchema,
  optionalImageReferenceSchema,
  toClientActivity,
  toClientChallengeActivity,
  toClientChallengeSnippet,
  toClientGroupSnippet,
  toClientSubmissionActivity,
  toClientSubmissionSnippet,
} from "../utils";

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

describe("imageReferenceSchema", () => {
  it("accepts storage path", () => {
    const result = imageReferenceSchema.safeParse("images/activity-1.jpg");
    expect(result.success).toBe(true);
  });

  it("accepts HTTP URL", () => {
    const result = imageReferenceSchema.safeParse("https://example.com/image.png");
    expect(result.success).toBe(true);
  });

  it("accepts HTTPS URL", () => {
    const result = imageReferenceSchema.safeParse("https://example.com/image.webp");
    expect(result.success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = imageReferenceSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = imageReferenceSchema.safeParse(null as unknown as string);
    expect(result.success).toBe(false);
  });

  it("rejects invalid path", () => {
    const result = imageReferenceSchema.safeParse("foo/bar");
    expect(result.success).toBe(false);
  });

  it("rejects invalid bucket path", () => {
    const result = imageReferenceSchema.safeParse("foo/bar");
    expect(result.success).toBe(false);
  });
});

describe("optionalImageReferenceSchema", () => {
  it("accepts valid image reference", () => {
    const result = optionalImageReferenceSchema.safeParse("images/photo.jpg");
    expect(result.success).toBe(true);
    expect(result.data).toBe("images/photo.jpg");
  });

  it("rejects null", () => {
    const result = optionalImageReferenceSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("accepts undefined", () => {
    const result = optionalImageReferenceSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it("rejects invalid value", () => {
    const result = optionalImageReferenceSchema.safeParse("foo/bar");
    expect(result.success).toBe(false);
  });
});

describe("ensureTripParticipant", () => {
  it("returns participant when user is a participant", async () => {
    const { tripParticipants, trips, users, groups } = await import("@mirai-app/db");

    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await testDb.db.insert(users).values({
      id: "user-1",
      authUserId: "auth-1",
      firstName: "Test",
      lastName: "User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await testDb.db.insert(groups).values({
      id: "g1",
      tripId: "trip-1",
      name: "Group",
      description: "",
      organizerId: "user-1",
      code: "CODE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await testDb.db.insert(tripParticipants).values({
      id: "p1",
      userId: "user-1",
      tripId: "trip-1",
      groupId: "g1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await ensureTripParticipant(
      { db: testDb.db, dbUser: { id: "user-1" } },
      "trip-1",
    );

    expect(result).toMatchObject({
      id: "p1",
      tripId: "trip-1",
      groupId: "g1",
    });
  });

  it("throws FORBIDDEN when user is not a participant", async () => {
    const result = ensureTripParticipant(
      { db: testDb.db, dbUser: { id: "unknown-user" } },
      "trip-1",
    );

    await expect(result).rejects.toThrow("You are not a participant of this trip");
    try {
      await result;
    } catch (error) {
      expect((error as Error & { code: string }).code).toBe("FORBIDDEN");
    }
  });
});

describe("ensureTripExists", () => {
  it("returns trip when it exists", async () => {
    const { trips } = await import("@mirai-app/db");
    await testDb.db.insert(trips).values({
      id: "trip-1",
      name: "Test Trip",
      description: "",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await ensureTripExists({ db: testDb.db }, "trip-1");

    expect(result).toMatchObject({ id: "trip-1" });
  });

  it("throws NOT_FOUND when trip does not exist", async () => {
    const result = ensureTripExists({ db: testDb.db }, "nonexistent-trip");

    await expect(result).rejects.toThrow("Trip not found");
    try {
      await result;
    } catch (error) {
      expect((error as Error & { code: string }).code).toBe("NOT_FOUND");
    }
  });
});

describe("toClientActivity", () => {
  it("coalesces null description to empty string", () => {
    const result = toClientActivity({
      description: null,
      imageUrl: "img.jpg",
      hiddenReason: null,
      createdByAdmin: null,
    });
    expect(result.description).toBe("");
    expect(result.imageUrl).toBe("img.jpg");
    expect(result.hiddenReason).toBe("");
    expect(result.createdByAdmin).toBe("");
  });

  it("preserves non-null values", () => {
    const result = toClientActivity({
      description: "Some desc",
      imageUrl: "https://example.com/img.jpg",
      hiddenReason: "spam",
      createdByAdmin: "admin-1",
    });
    expect(result.description).toBe("Some desc");
    expect(result.imageUrl).toBe("https://example.com/img.jpg");
    expect(result.hiddenReason).toBe("spam");
    expect(result.createdByAdmin).toBe("admin-1");
  });

  it("coalesces null imageUrl to empty string", () => {
    const result = toClientActivity({
      description: "desc",
      imageUrl: null,
      hiddenReason: "",
      createdByAdmin: "",
    });
    expect(result.imageUrl).toBe("");
  });
});

describe("toClientSubmissionActivity", () => {
  it("coalesces null ranking and pointsAwarded", () => {
    const result = toClientSubmissionActivity({
      ranking: null,
      pointsAwarded: null,
    });
    expect(result.ranking).toBe(0);
    expect(result.pointsAwarded).toBe(0);
  });

  it("preserves non-null ranking and points", () => {
    const result = toClientSubmissionActivity({
      ranking: 5,
      pointsAwarded: 100,
    });
    expect(result.ranking).toBe(5);
    expect(result.pointsAwarded).toBe(100);
  });
});

describe("toClientChallengeActivity", () => {
  it("coalesces null submissionType, basePoints, submissionCount", () => {
    const result = toClientChallengeActivity({
      submissionType: null,
      basePoints: null,
      submissionCount: null,
    });
    expect(result.submissionType).toBe("");
    expect(result.basePoints).toBe(0);
    expect(result.submissionCount).toBe(0);
  });

  it("preserves non-null values", () => {
    const result = toClientChallengeActivity({
      submissionType: "IMAGE",
      basePoints: 10,
      submissionCount: 5,
    });
    expect(result.submissionType).toBe("IMAGE");
    expect(result.basePoints).toBe(10);
    expect(result.submissionCount).toBe(5);
  });
});

describe("toClientGroupSnippet", () => {
  it("coalesces null image to empty string", () => {
    const result = toClientGroupSnippet({
      image: null,
    });
    expect(result.image).toBe("");
  });

  it("preserves non-null image", () => {
    const result = toClientGroupSnippet({
      image: "group.jpg",
    });
    expect(result.image).toBe("group.jpg");
  });
});

describe("toClientChallengeSnippet", () => {
  it("coalesces null description, image, submissionType", () => {
    const result = toClientChallengeSnippet({
      description: null,
      image: null,
      submissionType: null,
    });
    expect(result.description).toBe("");
    expect(result.image).toBe("");
    expect(result.submissionType).toBe("");
  });

  it("preserves non-null values", () => {
    const result = toClientChallengeSnippet({
      description: "Challenge desc",
      image: "challenge.jpg",
      submissionType: "IMAGE",
    });
    expect(result.description).toBe("Challenge desc");
    expect(result.image).toBe("challenge.jpg");
    expect(result.submissionType).toBe("IMAGE");
  });
});

describe("toClientSubmissionSnippet", () => {
  it("coalesces null awardedPoints, bonusPoints, ranking", () => {
    const result = toClientSubmissionSnippet({
      awardedPoints: null,
      bonusPoints: null,
      ranking: null,
    });
    expect(result.awardedPoints).toBe(0);
    expect(result.bonusPoints).toBe(0);
    expect(result.ranking).toBe(0);
  });

  it("preserves non-null values", () => {
    const result = toClientSubmissionSnippet({
      awardedPoints: 100,
      bonusPoints: 20,
      ranking: 1,
    });
    expect(result.awardedPoints).toBe(100);
    expect(result.bonusPoints).toBe(20);
    expect(result.ranking).toBe(1);
  });
});
