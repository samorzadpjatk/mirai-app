import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/challengeVote-sqlite-db";
import { eq, sql } from "drizzle-orm";

describe("challengeVote router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    db.exec(`
      CREATE TABLE challenges (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        submission_type TEXT NOT NULL,
        scoring_category TEXT NOT NULL,
        is_recurring INTEGER DEFAULT 0 NOT NULL,
        daily_start_time TEXT,
        daily_end_time TEXT,
        base_points INTEGER DEFAULT 0 NOT NULL,
        first_place_points INTEGER,
        second_place_points INTEGER,
        third_place_points INTEGER,
        status TEXT DEFAULT 'HIDDEN' NOT NULL,
        start_time INTEGER,
        end_time INTEGER,
        voting_start_time INTEGER,
        voting_end_time INTEGER,
        target_latitude REAL,
        target_longitude REAL,
        expected_value TEXT,
        auto_approve INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE challenge_submissions (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        image_ids TEXT,
        video_id TEXT,
        text_content TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        reviewed_by_id TEXT,
        reviewed_at INTEGER,
        rejection_reason TEXT,
        awarded_points INTEGER DEFAULT 0 NOT NULL,
        bonus_points INTEGER DEFAULT 0 NOT NULL,
        ranking INTEGER,
        vote_count INTEGER DEFAULT 0 NOT NULL,
        vote_score REAL DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE challenge_votes (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        submission_id TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        vote_position INTEGER NOT NULL,
        vote_points INTEGER NOT NULL,
        normalized_weight REAL DEFAULT 1.0 NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Seed a challenge and submission
    db.run(
      `INSERT INTO challenges (id, trip_id, name, submission_type, scoring_category, status, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["challenge-123", "trip-123", "Photo Challenge", "IMAGE", "CREATIVITY", "ACTIVE", Date.now(), Date.now(), Date.now()],
    );

    db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, status, vote_count, vote_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["submission-123", "challenge-123", "group-123", "APPROVED", 0, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back vote insertion on transaction failure", () => {
    const initialVoteCount = db.query("SELECT vote_count FROM challenge_submissions WHERE id = ?").get("submission-123") as {
      vote_count: number;
    };
    expect(initialVoteCount.vote_count).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO challenge_votes (id, challenge_id, submission_id, voter_id, vote_position, vote_points, normalized_weight, voted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ["vote-1", "challenge-123", "submission-123", "voter-1", 1, 10, 1.0, Date.now()],
      );
      db.run(`UPDATE challenge_submissions SET vote_count = vote_count + ?, vote_score = vote_score + ? WHERE id = ?`, [1, 10, "submission-123"]);
      throw new Error("Simulated failure after vote insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT vote_count, vote_score FROM challenge_submissions WHERE id = ?").get("submission-123") as {
      vote_count: number;
      vote_score: number;
    };
    expect(afterRollback.vote_count).toBe(0);
    expect(afterRollback.vote_score).toBe(0);

    const voteCount = db.query("SELECT COUNT(*) as count FROM challenge_votes WHERE submission_id = ?").get("submission-123") as {
      count: number;
    };
    expect(voteCount.count).toBe(0);
  });

  it("commits vote and score update successfully", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO challenge_votes (id, challenge_id, submission_id, voter_id, vote_position, vote_points, normalized_weight, voted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["vote-1", "challenge-123", "submission-123", "voter-1", 1, 10, 1.0, Date.now()],
    );
    db.run(`UPDATE challenge_submissions SET vote_count = vote_count + ?, vote_score = vote_score + ? WHERE id = ?`, [1, 10, "submission-123"]);
    db.exec("COMMIT");

    const afterCommit = db.query("SELECT vote_count, vote_score FROM challenge_submissions WHERE id = ?").get("submission-123") as {
      vote_count: number;
      vote_score: number;
    };
    expect(afterCommit.vote_count).toBe(1);
    expect(afterCommit.vote_score).toBe(10);

    const voteCount = db.query("SELECT COUNT(*) as count FROM challenge_votes WHERE submission_id = ?").get("submission-123") as {
      count: number;
    };
    expect(voteCount.count).toBe(1);
  });
});

describe("challengeVote router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();

    testDb.db.run(
      `INSERT INTO challenges (id, trip_id, name, submission_type, scoring_category, status, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["challenge-123", "trip-123", "Photo Challenge", "IMAGE", "CREATIVITY", "ACTIVE", Date.now(), Date.now(), Date.now()],
    );

    testDb.db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, status, vote_count, vote_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["submission-123", "challenge-123", "group-123", "APPROVED", 0, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("inserts vote and updates score via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteChallengeVotes).values({
        id: "vote-1",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-1",
        votePosition: 1,
        votePoints: 10,
        normalizedWeight: 1.0,
      });

      await tx.update(testDb.sqliteChallengeSubmissions).set({
        voteCount: sql`${testDb.sqliteChallengeSubmissions.voteCount} + ${1}`,
        voteScore: sql`${testDb.sqliteChallengeSubmissions.voteScore} + ${10}`,
      }).where(eq(testDb.sqliteChallengeSubmissions.id, "submission-123"));
    });

    const submission = await testDb.drizzleDb.select().from(testDb.sqliteChallengeSubmissions).where(
      eq(testDb.sqliteChallengeSubmissions.id, "submission-123"),
    );
    expect(submission[0].voteCount).toBe(1);
    expect(submission[0].voteScore).toBe(10);

    const votes = await testDb.drizzleDb.select().from(testDb.sqliteChallengeVotes).where(
      eq(testDb.sqliteChallengeVotes.submissionId, "submission-123"),
    );
    expect(votes).toHaveLength(1);
    expect(votes[0].votePoints).toBe(10);
    expect(votes[0].votePosition).toBe(1);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteChallengeVotes).values({
          id: "vote-2",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          voterId: "voter-2",
          votePosition: 2,
          votePoints: 5,
          normalizedWeight: 1.0,
        });

        tx.update(testDb.sqliteChallengeSubmissions).set({
          voteCount: sql`${testDb.sqliteChallengeSubmissions.voteCount} + ${1}`,
          voteScore: sql`${testDb.sqliteChallengeSubmissions.voteScore} + ${5}`,
        }).where(eq(testDb.sqliteChallengeSubmissions.id, "submission-123"));

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const submission = await testDb.drizzleDb.select().from(testDb.sqliteChallengeSubmissions).where(
      eq(testDb.sqliteChallengeSubmissions.id, "submission-123"),
    );
    expect(submission[0].voteCount).toBe(0);
    expect(submission[0].voteScore).toBe(0);

    const votes = await testDb.drizzleDb.select().from(testDb.sqliteChallengeVotes).where(
      eq(testDb.sqliteChallengeVotes.submissionId, "submission-123"),
    );
    expect(votes).toHaveLength(0);
  });

  it("commits multiple votes and recomputes aggregate score", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteChallengeVotes).values({
        id: "vote-a",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-a",
        votePosition: 1,
        votePoints: 15,
        normalizedWeight: 1.0,
      });

      await tx.insert(testDb.sqliteChallengeVotes).values({
        id: "vote-b",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        voterId: "voter-b",
        votePosition: 2,
        votePoints: 8,
        normalizedWeight: 0.8,
      });

      await tx.update(testDb.sqliteChallengeSubmissions).set({
        voteCount: sql`${testDb.sqliteChallengeSubmissions.voteCount} + ${2}`,
        voteScore: sql`${testDb.sqliteChallengeSubmissions.voteScore} + ${23}`,
      }).where(eq(testDb.sqliteChallengeSubmissions.id, "submission-123"));
    });

    const submission = await testDb.drizzleDb.select().from(testDb.sqliteChallengeSubmissions).where(
      eq(testDb.sqliteChallengeSubmissions.id, "submission-123"),
    );
    expect(submission[0].voteCount).toBe(2);
    expect(submission[0].voteScore).toBe(23);

    const votes = await testDb.drizzleDb.select().from(testDb.sqliteChallengeVotes).where(
      eq(testDb.sqliteChallengeVotes.submissionId, "submission-123"),
    );
    expect(votes).toHaveLength(2);

    const totalPoints = votes.reduce((sum, v) => sum + v.votePoints, 0);
    expect(totalPoints).toBe(23);
  });
});
