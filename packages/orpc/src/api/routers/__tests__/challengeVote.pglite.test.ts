import {
  challengeSubmissions,
  challengeVotes,
  challenges,
  groups,
  tripParticipants,
  trips,
  users,
} from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;
const now = () => new Date();

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

async function seedUser(id: string, authUserId: string, firstName: string, lastName: string) {
  await testDb.db
    .insert(users)
    .values({ id, authUserId, firstName, lastName, createdAt: now(), updatedAt: now() });
}

async function seedParticipant(id: string, userId: string, tripId: string, groupId?: string) {
  await testDb.db
    .insert(tripParticipants)
    .values({ id, userId, tripId, groupId, createdAt: now(), updatedAt: now() });
}

beforeAll(async () => {
  testDb = await createPgliteTestDb();
});

beforeEach(async () => {
  await testDb.reset();
});

afterAll(async () => {
  await testDb.cleanup();
});

describe("challengeVote router — PGLite transaction rollback", () => {
  beforeEach(async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedUser("user-a", "auth-a", "Carol", "White");
    await seedUser("user-b", "auth-b", "Dave", "Black");
    await seedTrip("trip-123", "Test Trip");
    await seedGroup("group-123", "trip-123", "Team A", "user-1", "TEAMA");
    await seedParticipant("participant-1", "user-1", "trip-123", "group-123");
    await seedParticipant("participant-2", "user-2", "trip-123", "group-123");
    await seedParticipant("participant-a", "user-a", "trip-123", "group-123");
    await seedParticipant("participant-b", "user-b", "trip-123", "group-123");

    await testDb.db.insert(challenges).values({
      id: "challenge-123",
      tripId: "trip-123",
      name: "Photo Challenge",
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      status: "ACTIVE",
      endTime: now(),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeSubmissions).values({
      id: "submission-123",
      challengeId: "challenge-123",
      groupId: "group-123",
      status: "APPROVED",
      voteCount: 0,
      voteScore: 0,
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("rolls back vote insertion on transaction failure", async () => {
    const [initialSubmission] = await testDb.db
      .select({ voteCount: challengeSubmissions.voteCount })
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(initialSubmission.voteCount).toBe(0);

    try {
      await testDb.db.transaction(async (tx) => {
        await tx.insert(challengeVotes).values({
          id: "vote-1",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          voterId: "participant-1",
          votePosition: 1,
          votePoints: 10,
          normalizedWeight: 1.0,
        });
        await tx
          .update(challengeSubmissions)
          .set({
            voteCount: sql`${challengeSubmissions.voteCount} + ${1}`,
            voteScore: sql`${challengeSubmissions.voteScore} + ${10}`,
          })
          .where(eq(challengeSubmissions.id, "submission-123"));
        throw new Error("Simulated failure after vote insert");
      });
    } catch {
      // Transaction rolled back automatically
    }

    const [afterRollback] = await testDb.db
      .select({
        voteCount: challengeSubmissions.voteCount,
        voteScore: challengeSubmissions.voteScore,
      })
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(afterRollback.voteCount).toBe(0);
    expect(afterRollback.voteScore).toBe(0);

    const votes = await testDb.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, "submission-123"));
    expect(votes).toHaveLength(0);
  });

  it("commits vote and score update successfully", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(challengeVotes).values({
        id: "vote-1",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "participant-1",
        votePosition: 1,
        votePoints: 10,
        normalizedWeight: 1.0,
      });
      await tx
        .update(challengeSubmissions)
        .set({
          voteCount: sql`${challengeSubmissions.voteCount} + ${1}`,
          voteScore: sql`${challengeSubmissions.voteScore} + ${10}`,
        })
        .where(eq(challengeSubmissions.id, "submission-123"));
    });

    const [afterCommit] = await testDb.db
      .select({
        voteCount: challengeSubmissions.voteCount,
        voteScore: challengeSubmissions.voteScore,
      })
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(afterCommit.voteCount).toBe(1);
    expect(afterCommit.voteScore).toBe(10);

    const votes = await testDb.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, "submission-123"));
    expect(votes).toHaveLength(1);
  });
});

describe("challengeVote router — Drizzle ORM PGLite integration", () => {
  beforeEach(async () => {
    await seedUser("user-1", "auth-1", "Alice", "Smith");
    await seedUser("user-2", "auth-2", "Bob", "Jones");
    await seedUser("user-a", "auth-a", "Carol", "White");
    await seedUser("user-b", "auth-b", "Dave", "Black");
    await seedTrip("trip-123", "Test Trip");
    await seedGroup("group-123", "trip-123", "Team A", "user-1", "TEAMA");
    await seedParticipant("participant-1", "user-1", "trip-123", "group-123");
    await seedParticipant("participant-2", "user-2", "trip-123", "group-123");
    await seedParticipant("participant-a", "user-a", "trip-123", "group-123");
    await seedParticipant("participant-b", "user-b", "trip-123", "group-123");

    await testDb.db.insert(challenges).values({
      id: "challenge-123",
      tripId: "trip-123",
      name: "Photo Challenge",
      submissionType: "IMAGE",
      scoringCategory: "PEER_VOTING",
      status: "ACTIVE",
      endTime: now(),
      createdAt: now(),
      updatedAt: now(),
    });

    await testDb.db.insert(challengeSubmissions).values({
      id: "submission-123",
      challengeId: "challenge-123",
      groupId: "group-123",
      status: "APPROVED",
      voteCount: 0,
      voteScore: 0,
      createdAt: now(),
      updatedAt: now(),
    });
  });

  it("inserts vote and updates score via Drizzle ORM transaction", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(challengeVotes).values({
        id: "vote-1",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "participant-1",
        votePosition: 1,
        votePoints: 10,
        normalizedWeight: 1.0,
      });

      await tx
        .update(challengeSubmissions)
        .set({
          voteCount: sql`${challengeSubmissions.voteCount} + ${1}`,
          voteScore: sql`${challengeSubmissions.voteScore} + ${10}`,
        })
        .where(eq(challengeSubmissions.id, "submission-123"));
    });

    const submission = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(submission[0].voteCount).toBe(1);
    expect(submission[0].voteScore).toBe(10);

    const votes = await testDb.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, "submission-123"));
    expect(votes).toHaveLength(1);
    expect(votes[0].votePoints).toBe(10);
    expect(votes[0].votePosition).toBe(1);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    await expect(
      testDb.db.transaction(async (tx) => {
        await tx.insert(challengeVotes).values({
          id: "vote-2",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          voterId: "participant-2",
          votePosition: 2,
          votePoints: 5,
          normalizedWeight: 1.0,
        });

        await tx
          .update(challengeSubmissions)
          .set({
            voteCount: sql`${challengeSubmissions.voteCount} + ${1}`,
            voteScore: sql`${challengeSubmissions.voteScore} + ${5}`,
          })
          .where(eq(challengeSubmissions.id, "submission-123"));

        throw new Error("Simulated failure");
      }),
    ).rejects.toThrow("Simulated failure");

    const submission = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(submission[0].voteCount).toBe(0);
    expect(submission[0].voteScore).toBe(0);

    const votes = await testDb.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, "submission-123"));
    expect(votes).toHaveLength(0);
  });

  it("commits multiple votes and recomputes aggregate score", async () => {
    await testDb.db.transaction(async (tx) => {
      await tx.insert(challengeVotes).values({
        id: "vote-a",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "participant-a",
        votePosition: 1,
        votePoints: 15,
        normalizedWeight: 1.0,
      });

      await tx.insert(challengeVotes).values({
        id: "vote-b",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "participant-b",
        votePosition: 2,
        votePoints: 8,
        normalizedWeight: 0.8,
      });

      await tx
        .update(challengeSubmissions)
        .set({
          voteCount: sql`${challengeSubmissions.voteCount} + ${2}`,
          voteScore: sql`${challengeSubmissions.voteScore} + ${23}`,
        })
        .where(eq(challengeSubmissions.id, "submission-123"));
    });

    const submission = await testDb.db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.id, "submission-123"));
    expect(submission[0].voteCount).toBe(2);
    expect(submission[0].voteScore).toBe(23);

    const votes = await testDb.db
      .select()
      .from(challengeVotes)
      .where(eq(challengeVotes.submissionId, "submission-123"));
    expect(votes).toHaveLength(2);

    const totalPoints = votes.reduce((sum, v) => sum + v.votePoints, 0);
    expect(totalPoints).toBe(23);
  });
});
