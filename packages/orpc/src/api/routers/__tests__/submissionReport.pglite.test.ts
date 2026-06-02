import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { eq } from "drizzle-orm";
import {
  challengeSubmissions,
  submissionReports,
  users,
  trips,
  groups,
  tripParticipants,
  challenges,
} from "@mirai-app/db";

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

async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
  await testDb.db
    .insert(users)
    .values({ id, authUserId, firstName, lastName, createdAt: now(), updatedAt: now() });
}

async function seedTrip(id: string, name: string) {
  await testDb.db.insert(trips).values({
    id,
    name,
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-07"),
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedGroup(
  id: string,
  tripId: string,
  name: string,
  organizerId: string,
  code: string,
) {
  await testDb.db
    .insert(groups)
    .values({ id, tripId, name, organizerId, code, createdAt: now(), updatedAt: now() });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db
    .insert(tripParticipants)
    .values({ id, userId, tripId, groupId, createdAt: now(), updatedAt: now() });
}

async function seedChallenge(id: string, tripId: string, name: string) {
  await testDb.db.insert(challenges).values({
    id,
    tripId,
    name,
    submissionType: "IMAGE",
    scoringCategory: "JUDGED_STAFF",
    status: "ACTIVE",
    createdAt: now(),
    updatedAt: now(),
  });
}

async function seedChallengeSubmission(id: string, challengeId: string, groupId: string) {
  await testDb.db.insert(challengeSubmissions).values({
    id,
    challengeId,
    groupId,
    status: "PENDING",
    createdAt: now(),
    updatedAt: now(),
  });
}

describe("submissionReport router — PGLite transaction rollback", () => {
  it("rolls back report insertion on transaction failure", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedChallenge("challenge-1", "trip-1", "Test Challenge");
    await seedChallengeSubmission("submission-123", "challenge-1", "group-1");

    const initialReports = await testDb.db
      .select()
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, "submission-123"));
    expect(initialReports).toHaveLength(0);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(submissionReports).values({
          id: "report-1",
          submissionId: "submission-123",
          reporterId: "tp-1",
          reason: "Inappropriate content",
          details: "Details here",
        });
        throw new Error("Simulated failure after insert");
      });
    } catch {
      // Expected rollback
    }

    const afterRollback = await testDb.db
      .select()
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, "submission-123"));
    expect(afterRollback).toHaveLength(0);
  });

  it("commits report insertion successfully when no failure occurs", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedChallenge("challenge-1", "trip-1", "Test Challenge");
    await seedChallengeSubmission("submission-123", "challenge-1", "group-1");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(submissionReports).values({
        id: "report-2",
        submissionId: "submission-123",
        reporterId: "tp-1",
        reason: "Spam",
        details: "Spam details",
      });
    });

    const afterCommit = await testDb.db
      .select()
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, "submission-123"));
    expect(afterCommit).toHaveLength(1);
    expect(afterCommit[0].reason).toBe("Spam");
    expect(afterCommit[0].details).toBe("Spam details");
  });
});

describe("submissionReport router — Drizzle ORM PGLite integration", () => {
  it("inserts a report via Drizzle ORM transaction", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedChallenge("challenge-1", "trip-1", "Test Challenge");
    await seedChallengeSubmission("submission-123", "challenge-1", "group-1");

    await testDb.db.transaction(async (tx) => {
      await tx.insert(submissionReports).values({
        id: "report-1",
        submissionId: "submission-123",
        reporterId: "tp-1",
        reason: "Inappropriate content",
        details: "Details here",
      });
    });

    const reports = await testDb.db
      .select()
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, "submission-123"));
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe("Inappropriate content");
    expect(reports[0].details).toBe("Details here");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedTrip("trip-1", "Test Trip");
    await seedGroup("group-1", "trip-1", "Team A", "user-1", "TEAMA");
    await seedParticipant("tp-1", "user-1", "trip-1", "group-1");
    await seedChallenge("challenge-1", "trip-1", "Test Challenge");
    await seedChallengeSubmission("submission-123", "challenge-1", "group-1");

    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(submissionReports).values({
          id: "report-2",
          submissionId: "submission-123",
          reporterId: "tp-1",
          reason: "Spam",
          details: "Spam details",
        });
        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const reports = await testDb.db
      .select()
      .from(submissionReports)
      .where(eq(submissionReports.submissionId, "submission-123"));
    expect(reports).toHaveLength(0);
  });
});
