import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/challengeSubmission-sqlite-db";
import { eq, sql } from "drizzle-orm";
import { validateSubmissionPayload, resolveAwardedPoints } from "@mirai-app/shared/challengeSubmissions";

describe("challengeSubmission router — raw SQLite transaction rollback", () => {
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
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
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
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE groups (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        is_deleted INTEGER DEFAULT 0 NOT NULL,
        organizer_id TEXT NOT NULL,
        code TEXT NOT NULL,
        coins INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE coin_transactions (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        admin_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    const now = Date.now();
    db.run(
      `INSERT INTO challenges (id, trip_id, name, submission_type, scoring_category, base_points, first_place_points, second_place_points, third_place_points, status, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["challenge-1", "trip-1", "Test Challenge", "IMAGE", "UNLIMITED", 10, 30, 20, 15, "ACTIVE", 1, now, now],
    );
    db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-1", "trip-1", "Test Group", "user-1", "1234", 100, now, now],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back createSubmission transaction on failure", () => {
    const now = Date.now();

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["submission-1", "challenge-1", "group-1", '["image-1"]', "APPROVED", now, now],
      );
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [10, "group-1"]);
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["coin-tx-1", "group-1", 10, "Auto-approved challenge: Test Challenge", "user-1", now, now],
      );
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }

    const submissionCount = db
      .query("SELECT COUNT(*) as count FROM challenge_submissions WHERE id = ?")
      .get("submission-1") as { count: number };
    expect(submissionCount.count).toBe(0);

    const group = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
      coins: number;
    };
    expect(group.coins).toBe(100);

    const txCount = db
      .query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(txCount.count).toBe(0);
  });

  it("rolls back updateMineSubmission transaction on failure", () => {
    const now = Date.now();
    db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["submission-1", "challenge-1", "group-1", '["image-1"]', "PENDING", now, now],
    );

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE challenge_submissions SET image_ids = ?, status = ?, reviewed_at = ? WHERE id = ?`,
        ['["image-2"]', "APPROVED", now, "submission-1"],
      );
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [10, "group-1"]);
      throw new Error("Simulated failure after update");
    } catch {
      db.exec("ROLLBACK");
    }

    const submission = db
      .query("SELECT status, image_ids FROM challenge_submissions WHERE id = ?")
      .get("submission-1") as { status: string; image_ids: string };
    expect(submission.status).toBe("PENDING");
    expect(submission.image_ids).toBe('["image-1"]');

    const group = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
      coins: number;
    };
    expect(group.coins).toBe(100);
  });

  it("rolls back reviewSubmission transaction on failure", () => {
    const now = Date.now();
    db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["submission-1", "challenge-1", "group-1", '["image-1"]', "PENDING", now, now],
    );

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `UPDATE challenge_submissions SET status = ?, awarded_points = ?, reviewed_by_id = ?, reviewed_at = ? WHERE id = ?`,
        ["APPROVED", 10, "admin-1", now, "submission-1"],
      );
      db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [10, "group-1"]);
      db.run(
        `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["coin-tx-1", "group-1", 10, "Challenge approved: Test Challenge", "admin-1", now, now],
      );
      throw new Error("Simulated failure after review updates");
    } catch {
      db.exec("ROLLBACK");
    }

    const submission = db
      .query("SELECT status, awarded_points FROM challenge_submissions WHERE id = ?")
      .get("submission-1") as { status: string; awarded_points: number };
    expect(submission.status).toBe("PENDING");
    expect(submission.awarded_points).toBe(0);

    const group = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
      coins: number;
    };
    expect(group.coins).toBe(100);

    const txCount = db
      .query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(txCount.count).toBe(0);
  });

  it("commits createSubmission transaction successfully", () => {
    const now = Date.now();

    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["submission-1", "challenge-1", "group-1", '["image-1"]', "APPROVED", now, now],
    );
    db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [10, "group-1"]);
    db.run(
      `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ["coin-tx-1", "group-1", 10, "Auto-approved challenge: Test Challenge", "user-1", now, now],
    );
    db.exec("COMMIT");

    const submissionCount = db
      .query("SELECT COUNT(*) as count FROM challenge_submissions WHERE id = ?")
      .get("submission-1") as { count: number };
    expect(submissionCount.count).toBe(1);

    const group = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
      coins: number;
    };
    expect(group.coins).toBe(110);

    const txCount = db
      .query("SELECT COUNT(*) as count FROM coin_transactions WHERE group_id = ?")
      .get("group-1") as { count: number };
    expect(txCount.count).toBe(1);
  });
});

describe("challengeSubmission router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    const now = Date.now();
    testDb.db.run(
      `INSERT INTO challenges (id, trip_id, name, submission_type, scoring_category, base_points, first_place_points, second_place_points, third_place_points, status, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["challenge-1", "trip-1", "Test Challenge", "IMAGE", "UNLIMITED", 10, 30, 20, 15, "ACTIVE", 1, now, now],
    );
    testDb.db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-1", "trip-1", "Test Group", "user-1", "1234", 100, 0, now, now],
    );
    testDb.db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, awarded_points, bonus_points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["submission-1", "challenge-1", "group-1", '["image-1"]', "PENDING", 0, 0, now, now],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("commits review submission via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx
        .update(testDb.sqliteChallengeSubmissions)
        .set({ status: "APPROVED", awardedPoints: 10, reviewedById: "admin-1" })
        .where(eq(testDb.sqliteChallengeSubmissions.id, "submission-1"));

      await tx
        .update(testDb.sqliteGroups)
        .set({
          coins: sql`${testDb.sqliteGroups.coins} + ${10}`,
        })
        .where(eq(testDb.sqliteGroups.id, "group-1"));

      await tx.insert(testDb.sqliteCoinTransactions).values({
        id: "coin-tx-1",
        groupId: "group-1",
        amount: 10,
        reason: "Challenge approved: Test Challenge",
        adminId: "admin-1",
      });
    });

    const submissions = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallengeSubmissions)
      .where(eq(testDb.sqliteChallengeSubmissions.id, "submission-1"));
    expect(submissions[0].status).toBe("APPROVED");
    expect(submissions[0].awardedPoints).toBe(10);

    const groups = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteGroups)
      .where(eq(testDb.sqliteGroups.id, "group-1"));
    expect(groups[0].coins).toBe(110);

    const txs = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteCoinTransactions)
      .where(eq(testDb.sqliteCoinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(10);
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.update(testDb.sqliteChallengeSubmissions)
          .set({ status: "APPROVED", awardedPoints: 10 })
          .where(eq(testDb.sqliteChallengeSubmissions.id, "submission-1"));

        tx.update(testDb.sqliteGroups)
          .set({
            coins: sql`${testDb.sqliteGroups.coins} + ${10}`,
          })
          .where(eq(testDb.sqliteGroups.id, "group-1"));

        tx.insert(testDb.sqliteCoinTransactions).values({
          id: "coin-tx-1",
          groupId: "group-1",
          amount: 10,
          reason: "Challenge approved: Test Challenge",
          adminId: "admin-1",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const submissions = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallengeSubmissions)
      .where(eq(testDb.sqliteChallengeSubmissions.id, "submission-1"));
    expect(submissions[0].status).toBe("PENDING");
    expect(submissions[0].awardedPoints).toBe(0);

    const groups = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteGroups)
      .where(eq(testDb.sqliteGroups.id, "group-1"));
    expect(groups[0].coins).toBe(100);

    const txs = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteCoinTransactions)
      .where(eq(testDb.sqliteCoinTransactions.groupId, "group-1"));
    expect(txs).toHaveLength(0);
  });

  it("validates pure functions with real SQLite data", async () => {
    const challenges = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallenges)
      .where(eq(testDb.sqliteChallenges.id, "challenge-1"));
    const dbChallenge = challenges[0];

    expect(() =>
      validateSubmissionPayload({
        submissionType: "IMAGE",
        imageIds: ["image-1"],
      }),
    ).not.toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "IMAGE",
        imageIds: [],
      }),
    ).toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "TEXT",
        textContent: "Hello",
      }),
    ).not.toThrow();

    expect(() =>
      validateSubmissionPayload({
        submissionType: "TEXT",
        textContent: "",
      }),
    ).toThrow();

    const basePoints = resolveAwardedPoints(dbChallenge, {});
    expect(basePoints).toBe(10);

    const firstPlace = resolveAwardedPoints(dbChallenge, { ranking: 1 });
    expect(firstPlace).toBe(30);

    const secondPlace = resolveAwardedPoints(dbChallenge, { ranking: 2 });
    expect(secondPlace).toBe(20);

    const thirdPlace = resolveAwardedPoints(dbChallenge, { ranking: 3 });
    expect(thirdPlace).toBe(15);

    const explicitPoints = resolveAwardedPoints(dbChallenge, { awardedPoints: 50 });
    expect(explicitPoints).toBe(50);

    const fallback = resolveAwardedPoints(dbChallenge, { ranking: 5 });
    expect(fallback).toBe(10);
  });
});
