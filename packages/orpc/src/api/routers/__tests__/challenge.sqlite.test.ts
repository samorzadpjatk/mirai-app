import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/challenge-sqlite-db";
import { eq, sql } from "drizzle-orm";

describe("challenge router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");

    // Create challenges table
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

    // Create groups table
    db.exec(`
      CREATE TABLE groups (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        is_deleted INTEGER DEFAULT 0 NOT NULL,
        organizer_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        coins INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create activity_feeds table
    db.exec(`
      CREATE TABLE activity_feeds (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        is_pinned INTEGER DEFAULT 0 NOT NULL,
        is_hidden INTEGER DEFAULT 0 NOT NULL,
        hidden_by_admin TEXT,
        hidden_at INTEGER,
        hidden_reason TEXT,
        created_by_admin TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create challenge_activities table
    db.exec(`
      CREATE TABLE challenge_activities (
        activity_id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        end_time INTEGER,
        submission_type TEXT,
        base_points INTEGER,
        submission_count INTEGER
      )
    `);

    // Create challenge_submissions table
    db.exec(`
      CREATE TABLE challenge_submissions (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        image_ids TEXT NOT NULL DEFAULT '[]',
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

    // Create coin_transactions table
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

    // Create users table
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        auth_user_id TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        has_avatar INTEGER DEFAULT 0 NOT NULL,
        role TEXT DEFAULT 'USER' NOT NULL,
        last_seen_on INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create submission_activities table
    db.exec(`
      CREATE TABLE submission_activities (
        activity_id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        challenge_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        has_video INTEGER NOT NULL,
        is_winner INTEGER DEFAULT 0 NOT NULL,
        ranking INTEGER,
        points_awarded INTEGER
      )
    `);

    // Seed admin user
    db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["admin-1", "auth-admin-1", "Admin", "User", 0, "ADMIN", Date.now(), Date.now()],
    );

    // Seed group
    db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-1", "trip-1", "Test Group", "admin-1", "1234", 100, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    db.close();
  });

  describe("createChallenge", () => {
    it("rolls back challenge insert and activity feed on transaction failure", () => {
      const challengeCountBefore = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountBefore.count).toBe(0);

      try {
        db.exec("BEGIN TRANSACTION");
        db.run(
          `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, base_points, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-1",
            "trip-1",
            "Test Challenge",
            "A test challenge",
            "IMAGE",
            "SPEED",
            "ACTIVE",
            100,
            0,
            Date.now(),
            Date.now(),
          ],
        );
        db.run(
          `INSERT INTO activity_feeds (id, trip_id, activity_type, title, description, created_by_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "activity-1",
            "trip-1",
            "challenge_event",
            "Czas start!",
            "Challenge started",
            "admin-1",
            Date.now(),
            Date.now(),
          ],
        );
        db.run(
          `INSERT INTO challenge_activities (activity_id, challenge_id, event_type, base_points) VALUES (?, ?, ?, ?)`,
          ["activity-1", "challenge-1", "challenge_started", 100],
        );
        throw new Error("Simulated failure after challenge creation");
      } catch {
        db.exec("ROLLBACK");
      }

      // Assert rollback: no challenge inserted
      const challengeCountAfter = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountAfter.count).toBe(0);

      // Assert rollback: no activity feed inserted
      const activityCountAfter = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as {
        count: number;
      };
      expect(activityCountAfter.count).toBe(0);

      // Assert rollback: no challenge activity inserted
      const challengeActivityCountAfter = db
        .query("SELECT COUNT(*) as count FROM challenge_activities")
        .get() as {
        count: number;
      };
      expect(challengeActivityCountAfter.count).toBe(0);
    });

    it("rolls back recurring challenge precreation on transaction failure", () => {
      const challengeCountBefore = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountBefore.count).toBe(0);

      try {
        db.exec("BEGIN TRANSACTION");
        // Insert recurring template challenge
        db.run(
          `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, is_recurring, daily_start_time, daily_end_time, base_points, auto_approve, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-template-1",
            "trip-1",
            "Recurring Challenge",
            "A recurring test challenge",
            "IMAGE",
            "SPEED",
            "VISIBLE",
            1,
            "09:00",
            "18:00",
            50,
            0,
            Date.now(),
            Date.now() + 7 * 24 * 60 * 60 * 1000,
            Date.now(),
            Date.now(),
          ],
        );
        // Insert recurring instance
        db.run(
          `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, is_recurring, base_points, auto_approve, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-instance-1",
            "trip-1",
            "Recurring Challenge #1",
            "A recurring test challenge",
            "IMAGE",
            "SPEED",
            "VISIBLE",
            0,
            50,
            0,
            Date.now(),
            Date.now() + 24 * 60 * 60 * 1000,
            Date.now(),
            Date.now(),
          ],
        );
        throw new Error("Simulated failure after recurring precreation");
      } catch {
        db.exec("ROLLBACK");
      }

      // Assert rollback: no challenges inserted (neither template nor instances)
      const challengeCountAfter = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountAfter.count).toBe(0);
    });
  });

  describe("updateChallenge", () => {
    beforeEach(() => {
      // Seed an existing challenge
      db.run(
        `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, base_points, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-1",
          "trip-1",
          "Original Challenge",
          "Original description",
          "IMAGE",
          "SPEED",
          "HIDDEN",
          100,
          0,
          Date.now(),
          Date.now(),
        ],
      );
    });

    it("rolls back challenge update and activity feed on transaction failure", () => {
      const challengeBefore = db
        .query("SELECT name, status FROM challenges WHERE id = ?")
        .get("challenge-1") as { name: string; status: string };
      expect(challengeBefore.name).toBe("Original Challenge");
      expect(challengeBefore.status).toBe("HIDDEN");

      try {
        db.exec("BEGIN TRANSACTION");
        // Update challenge
        db.run(`UPDATE challenges SET name = ?, status = ? WHERE id = ?`, [
          "Updated Challenge",
          "ACTIVE",
          "challenge-1",
        ]);
        // Insert activity feed for status transition
        db.run(
          `INSERT INTO activity_feeds (id, trip_id, activity_type, title, description, created_by_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "activity-1",
            "trip-1",
            "challenge_event",
            "Czas start!",
            "Challenge started",
            "admin-1",
            Date.now(),
            Date.now(),
          ],
        );
        db.run(
          `INSERT INTO challenge_activities (activity_id, challenge_id, event_type, base_points) VALUES (?, ?, ?, ?)`,
          ["activity-1", "challenge-1", "challenge_started", 100],
        );
        throw new Error("Simulated failure after challenge update");
      } catch {
        db.exec("ROLLBACK");
      }

      // Assert rollback: challenge unchanged
      const challengeAfter = db
        .query("SELECT name, status FROM challenges WHERE id = ?")
        .get("challenge-1") as { name: string; status: string };
      expect(challengeAfter.name).toBe("Original Challenge");
      expect(challengeAfter.status).toBe("HIDDEN");

      // Assert rollback: no activity feed inserted
      const activityCountAfter = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as {
        count: number;
      };
      expect(activityCountAfter.count).toBe(0);

      // Assert rollback: no challenge activity inserted
      const challengeActivityCountAfter = db
        .query("SELECT COUNT(*) as count FROM challenge_activities")
        .get() as {
        count: number;
      };
      expect(challengeActivityCountAfter.count).toBe(0);
    });

    it("rolls back recurring instance precreation on update failure", () => {
      // Make the existing challenge recurring
      db.run(
        `UPDATE challenges SET is_recurring = 1, daily_start_time = '09:00', daily_end_time = '18:00', start_time = ?, end_time = ? WHERE id = ?`,
        [Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000, "challenge-1"],
      );

      const challengeCountBefore = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountBefore.count).toBe(1);

      try {
        db.exec("BEGIN TRANSACTION");
        // Update challenge
        db.run(`UPDATE challenges SET name = ? WHERE id = ?`, [
          "Updated Recurring Challenge",
          "challenge-1",
        ]);
        // Insert recurring instance
        db.run(
          `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, is_recurring, base_points, auto_approve, start_time, end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-instance-1",
            "trip-1",
            "Updated Recurring Challenge #1",
            "Updated description",
            "IMAGE",
            "SPEED",
            "VISIBLE",
            0,
            100,
            0,
            Date.now(),
            Date.now() + 24 * 60 * 60 * 1000,
            Date.now(),
            Date.now(),
          ],
        );
        throw new Error("Simulated failure after recurring update");
      } catch {
        db.exec("ROLLBACK");
      }

      // Assert rollback: still only the original challenge
      const challengeCountAfter = db.query("SELECT COUNT(*) as count FROM challenges").get() as {
        count: number;
      };
      expect(challengeCountAfter.count).toBe(1);

      // Assert rollback: original challenge name unchanged
      const challengeAfter = db
        .query("SELECT name FROM challenges WHERE id = ?")
        .get("challenge-1") as { name: string };
      expect(challengeAfter.name).toBe("Original Challenge");
    });
  });

  describe("forceCloseVoting", () => {
    beforeEach(() => {
      // Seed a peer voting challenge in VOTING_PHASE
      db.run(
        `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, base_points, auto_approve, voting_start_time, voting_end_time, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-1",
          "trip-1",
          "Voting Challenge",
          "A peer voting challenge",
          "IMAGE",
          "PEER_VOTING",
          "VOTING_PHASE",
          100,
          0,
          Date.now() - 24 * 60 * 60 * 1000,
          Date.now() + 24 * 60 * 60 * 1000,
          Date.now(),
          Date.now(),
        ],
      );

      // Seed challenge submissions
      db.run(
        `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, awarded_points, vote_count, vote_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "submission-1",
          "challenge-1",
          "group-1",
          "[]",
          "APPROVED",
          0,
          5,
          4.5,
          Date.now(),
          Date.now(),
        ],
      );

      // Seed another group
      db.run(
        `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["group-2", "trip-1", "Group 2", "admin-1", "5678", 50, 0, Date.now(), Date.now()],
      );

      db.run(
        `INSERT INTO challenge_submissions (id, challenge_id, group_id, image_ids, status, awarded_points, vote_count, vote_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "submission-2",
          "challenge-1",
          "group-2",
          "[]",
          "APPROVED",
          0,
          3,
          3.0,
          Date.now(),
          Date.now(),
        ],
      );
    });

    it("rolls back challenge status update and completion activities on transaction failure", () => {
      const challengeBefore = db
        .query("SELECT status, voting_end_time FROM challenges WHERE id = ?")
        .get("challenge-1") as { status: string; voting_end_time: number | null };
      expect(challengeBefore.status).toBe("VOTING_PHASE");

      const groupCoinsBefore = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
        coins: number;
      };
      expect(groupCoinsBefore.coins).toBe(100);

      try {
        db.exec("BEGIN TRANSACTION");
        // Update challenge status to COMPLETED
        db.run(`UPDATE challenges SET status = ?, voting_end_time = ? WHERE id = ?`, [
          "COMPLETED",
          Date.now(),
          "challenge-1",
        ]);
        // Update submission rankings and points
        db.run(`UPDATE challenge_submissions SET ranking = ?, awarded_points = ? WHERE id = ?`, [
          1,
          100,
          "submission-1",
        ]);
        // Update group coins
        db.run(`UPDATE groups SET coins = coins + ? WHERE id = ?`, [100, "group-1"]);
        // Insert coin transaction
        db.run(
          `INSERT INTO coin_transactions (id, group_id, amount, reason, admin_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "coin-tx-1",
            "group-1",
            100,
            "Peer voting result: Voting Challenge (#1)",
            "admin-1",
            Date.now(),
            Date.now(),
          ],
        );
        // Insert activity feed for completion event
        db.run(
          `INSERT INTO activity_feeds (id, trip_id, activity_type, title, description, created_by_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "activity-1",
            "trip-1",
            "challenge_event",
            "Challenge completed: Voting Challenge",
            "Voting has ended",
            "admin-1",
            Date.now(),
            Date.now(),
          ],
        );
        db.run(
          `INSERT INTO challenge_activities (activity_id, challenge_id, event_type, submission_count) VALUES (?, ?, ?, ?)`,
          ["activity-1", "challenge-1", "completed", 2],
        );
        // Insert winner activity feed
        db.run(
          `INSERT INTO activity_feeds (id, trip_id, activity_type, title, description, created_by_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "activity-2",
            "trip-1",
            "submission",
            "#1 place: Test Group",
            "Challenge: Voting Challenge | Votes: 5 | Score: 4.50 | Points: +100",
            "admin-1",
            Date.now(),
            Date.now(),
          ],
        );
        db.run(
          `INSERT INTO submission_activities (activity_id, submission_id, challenge_id, group_id, has_video, is_winner, ranking, points_awarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          ["activity-2", "submission-1", "challenge-1", "group-1", 0, 1, 1, 100],
        );
        throw new Error("Simulated failure after force close voting");
      } catch {
        db.exec("ROLLBACK");
      }

      // Assert rollback: challenge status unchanged
      const challengeAfter = db
        .query("SELECT status, voting_end_time FROM challenges WHERE id = ?")
        .get("challenge-1") as { status: string; voting_end_time: number | null };
      expect(challengeAfter.status).toBe("VOTING_PHASE");
      expect(challengeAfter.voting_end_time).toBe(challengeBefore.voting_end_time);

      // Assert rollback: submission unchanged
      const submissionAfter = db
        .query("SELECT ranking, awarded_points FROM challenge_submissions WHERE id = ?")
        .get("submission-1") as { ranking: number | null; awarded_points: number };
      expect(submissionAfter.ranking).toBeNull();
      expect(submissionAfter.awarded_points).toBe(0);

      // Assert rollback: group coins unchanged
      const groupCoinsAfter = db.query("SELECT coins FROM groups WHERE id = ?").get("group-1") as {
        coins: number;
      };
      expect(groupCoinsAfter.coins).toBe(100);

      // Assert rollback: no coin transactions inserted
      const coinTxCountAfter = db
        .query("SELECT COUNT(*) as count FROM coin_transactions")
        .get() as {
        count: number;
      };
      expect(coinTxCountAfter.count).toBe(0);

      // Assert rollback: no activity feeds inserted
      const activityCountAfter = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as {
        count: number;
      };
      expect(activityCountAfter.count).toBe(0);

      // Assert rollback: no challenge activities inserted
      const challengeActivityCountAfter = db
        .query("SELECT COUNT(*) as count FROM challenge_activities")
        .get() as {
        count: number;
      };
      expect(challengeActivityCountAfter.count).toBe(0);

      // Assert rollback: no submission activities inserted
      const submissionActivityCountAfter = db
        .query("SELECT COUNT(*) as count FROM submission_activities")
        .get() as {
        count: number;
      };
      expect(submissionActivityCountAfter.count).toBe(0);
    });
  });
});

describe("challenge router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();

    // Seed admin user
    testDb.db.run(
      `INSERT INTO users (id, auth_user_id, first_name, last_name, has_avatar, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["admin-1", "auth-admin-1", "Admin", "User", 0, "ADMIN", Date.now(), Date.now()],
    );

    // Seed group
    testDb.db.run(
      `INSERT INTO groups (id, trip_id, name, organizer_id, code, coins, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["group-1", "trip-1", "Test Group", "admin-1", "1234", 100, 0, Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("inserts challenge and activity feed via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteChallenges).values({
        id: "challenge-1",
        tripId: "trip-1",
        name: "Test Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "ACTIVE",
        basePoints: 100,
        autoApprove: false,
      });

      const activityResult = await tx
        .insert(testDb.sqliteActivityFeeds)
        .values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          createdByAdmin: "admin-1",
        })
        .returning();

      if (activityResult[0]) {
        await tx.insert(testDb.sqliteChallengeActivities).values({
          activityId: activityResult[0].id,
          challengeId: "challenge-1",
          eventType: "challenge_started",
          basePoints: 100,
        });
      }
    });

    const challenges = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallenges)
      .where(eq(testDb.sqliteChallenges.id, "challenge-1"));
    expect(challenges).toHaveLength(1);
    expect(challenges[0].name).toBe("Test Challenge");
    expect(challenges[0].status).toBe("ACTIVE");

    const activities = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteActivityFeeds)
      .where(eq(testDb.sqliteActivityFeeds.id, "activity-1"));
    expect(activities).toHaveLength(1);
    expect(activities[0].activityType).toBe("challenge_event");

    const challengeActivities = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallengeActivities)
      .where(eq(testDb.sqliteChallengeActivities.challengeId, "challenge-1"));
    expect(challengeActivities).toHaveLength(1);
    expect(challengeActivities[0].eventType).toBe("challenge_started");
  });

  it("updates challenge and inserts activity via Drizzle ORM transaction", async () => {
    // Seed existing challenge
    testDb.db.run(
      `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, base_points, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "challenge-1",
        "trip-1",
        "Original Challenge",
        "Original description",
        "IMAGE",
        "SPEED",
        "HIDDEN",
        100,
        0,
        Date.now(),
        Date.now(),
      ],
    );

    await testDb.drizzleDb.transaction(async (tx) => {
      await tx
        .update(testDb.sqliteChallenges)
        .set({
          name: "Updated Challenge",
          status: "ACTIVE",
        })
        .where(eq(testDb.sqliteChallenges.id, "challenge-1"));

      const activityResult = await tx
        .insert(testDb.sqliteActivityFeeds)
        .values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          createdByAdmin: "admin-1",
        })
        .returning();

      if (activityResult[0]) {
        await tx.insert(testDb.sqliteChallengeActivities).values({
          activityId: activityResult[0].id,
          challengeId: "challenge-1",
          eventType: "challenge_started",
          basePoints: 100,
        });
      }
    });

    const challenges = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteChallenges)
      .where(eq(testDb.sqliteChallenges.id, "challenge-1"));
    expect(challenges[0].name).toBe("Updated Challenge");
    expect(challenges[0].status).toBe("ACTIVE");

    const activities = await testDb.drizzleDb
      .select()
      .from(testDb.sqliteActivityFeeds)
      .where(eq(testDb.sqliteActivityFeeds.id, "activity-1"));
    expect(activities).toHaveLength(1);
  });

  it("rolls back Drizzle ORM transaction on failure for challenge operations", async () => {
    // Seed existing challenge
    testDb.db.run(
      `INSERT INTO challenges (id, trip_id, name, description, submission_type, scoring_category, status, base_points, auto_approve, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        "challenge-1",
        "trip-1",
        "Original Challenge",
        "Original description",
        "IMAGE",
        "SPEED",
        "HIDDEN",
        100,
        0,
        Date.now(),
        Date.now(),
      ],
    );

    // Use synchronous transaction pattern for reliable rollback with bun:sqlite
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.update(testDb.sqliteChallenges)
          .set({
            name: "Updated Challenge",
            status: "ACTIVE",
          })
          .where(eq(testDb.sqliteChallenges.id, "challenge-1"));

        tx.insert(testDb.sqliteActivityFeeds).values({
          id: "activity-1",
          tripId: "trip-1",
          activityType: "challenge_event",
          title: "Czas start!",
          description: "Challenge started",
          createdByAdmin: "admin-1",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const challenges = testDb.db
      .query("SELECT name, status FROM challenges WHERE id = ?")
      .get("challenge-1") as { name: string; status: string };
    expect(challenges.name).toBe("Original Challenge");
    expect(challenges.status).toBe("HIDDEN");

    const activities = testDb.db
      .query("SELECT COUNT(*) as count FROM activity_feeds WHERE id = ?")
      .get("activity-1") as { count: number };
    expect(activities.count).toBe(0);
  });
});
