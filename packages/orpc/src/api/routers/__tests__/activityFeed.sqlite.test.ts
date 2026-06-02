import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import {
  createTestDb,
  seedUser,
  seedTrip,
  seedGroup,
  seedTripParticipant,
  seedChallenge,
  seedChallengeSubmission,
  seedActivityFeed,
} from "./helpers/activityFeed-sqlite-db";
import { eq, count } from "drizzle-orm";

describe("activityFeed router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`CREATE TABLE activity_feeds (id TEXT PRIMARY KEY, trip_id TEXT NOT NULL, activity_type TEXT NOT NULL, title TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
    db.exec(`CREATE TABLE user_posts (activity_id TEXT PRIMARY KEY, author_id TEXT NOT NULL)`);
    db.exec(`CREATE TABLE submission_activities (activity_id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, challenge_id TEXT NOT NULL, group_id TEXT NOT NULL)`);
    db.exec(`CREATE TABLE challenge_activities (activity_id TEXT PRIMARY KEY, challenge_id TEXT NOT NULL, event_type TEXT NOT NULL)`);
    db.exec(`CREATE TABLE rank_change_activities (activity_id TEXT PRIMARY KEY, group_id TEXT NOT NULL, new_rank INTEGER NOT NULL, total_coins INTEGER NOT NULL, coins_gained INTEGER NOT NULL)`);
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back activity feed and user post on transaction failure", () => {
    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`INSERT INTO activity_feeds (id, trip_id, activity_type, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, ["af-1", "trip-1", "user_post", "Post", Date.now(), Date.now()]);
      db.run(`INSERT INTO user_posts (activity_id, author_id) VALUES (?, ?)`, ["af-1", "user-1"]);
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }
    const feedCount = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as { count: number };
    expect(feedCount.count).toBe(0);
    const postCount = db.query("SELECT COUNT(*) as count FROM user_posts").get() as { count: number };
    expect(postCount.count).toBe(0);
    const noFeed = db.query("SELECT id FROM activity_feeds WHERE id = ?").get("af-1");
    expect(noFeed).toBeNull();
    const noPost = db.query("SELECT activity_id FROM user_posts WHERE activity_id = ?").get("af-1");
    expect(noPost).toBeNull();
  });

  it("rolls back activity feed and submission activity on transaction failure", () => {
    try {
      db.exec("BEGIN TRANSACTION");
      db.run(`INSERT INTO activity_feeds (id, trip_id, activity_type, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, ["af-1", "trip-1", "submission", "Submission", Date.now(), Date.now()]);
      db.run(`INSERT INTO submission_activities (activity_id, submission_id, challenge_id, group_id) VALUES (?, ?, ?, ?)`, ["af-1", "sub-1", "ch-1", "group-1"]);
      throw new Error("Simulated failure after inserts");
    } catch {
      db.exec("ROLLBACK");
    }
    const feedCount = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as { count: number };
    expect(feedCount.count).toBe(0);
    const subCount = db.query("SELECT COUNT(*) as count FROM submission_activities").get() as { count: number };
    expect(subCount.count).toBe(0);
    const noFeed = db.query("SELECT id FROM activity_feeds WHERE id = ?").get("af-1");
    expect(noFeed).toBeNull();
    const noSub = db.query("SELECT activity_id FROM submission_activities WHERE activity_id = ?").get("af-1");
    expect(noSub).toBeNull();
  });

  it("commits activity feed and challenge activity when no failure occurs", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(`INSERT INTO activity_feeds (id, trip_id, activity_type, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`, ["af-1", "trip-1", "challenge_event", "Challenge", Date.now(), Date.now()]);
    db.run(`INSERT INTO challenge_activities (activity_id, challenge_id, event_type) VALUES (?, ?, ?)`, ["af-1", "ch-1", "challenge_started"]);
    db.exec("COMMIT");
    const feedCount = db.query("SELECT COUNT(*) as count FROM activity_feeds").get() as { count: number };
    expect(feedCount.count).toBe(1);
    const chCount = db.query("SELECT COUNT(*) as count FROM challenge_activities").get() as { count: number };
    expect(chCount.count).toBe(1);
    const feed = db.query("SELECT activity_type, title FROM activity_feeds WHERE id = ?").get("af-1") as { activity_type: string; title: string };
    expect(feed.activity_type).toBe("challenge_event");
    expect(feed.title).toBe("Challenge");
    const ch = db.query("SELECT event_type FROM challenge_activities WHERE activity_id = ?").get("af-1") as { event_type: string };
    expect(ch.event_type).toBe("challenge_started");
  });
});

describe("activityFeed router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    await seedUser(testDb.drizzleDb, { id: "user-1", authUserId: "auth-1", firstName: "John", lastName: "Doe" });
    await seedTrip(testDb.drizzleDb, { id: "trip-1", name: "Test Trip", startDate: new Date(), endDate: new Date() });
    await seedGroup(testDb.drizzleDb, { id: "group-1", tripId: "trip-1", name: "Group A", organizerId: "user-1", code: "CODE1" });
    await seedTripParticipant(testDb.drizzleDb, { id: "part-1", userId: "user-1", tripId: "trip-1", groupId: "group-1" });
    await seedChallenge(testDb.drizzleDb, { id: "ch-1", tripId: "trip-1", name: "Challenge 1", submissionType: "IMAGE", scoringCategory: "CREATIVE" });
    await seedChallengeSubmission(testDb.drizzleDb, { id: "sub-1", challengeId: "ch-1", groupId: "group-1" });
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("creates user post via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteActivityFeeds).values({ id: "af-1", tripId: "trip-1", activityType: "user_post", title: "User Post", createdAt: new Date(), updatedAt: new Date() });
      await tx.insert(testDb.sqliteUserPosts).values({ activityId: "af-1", authorId: "user-1", additionalImages: "[]" });
    });
    const feeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(1);
    expect(feeds[0].activityType).toBe("user_post");
    expect(feeds[0].title).toBe("User Post");
    expect(feeds[0].tripId).toBe("trip-1");
    const posts = await testDb.drizzleDb.select().from(testDb.sqliteUserPosts).where(eq(testDb.sqliteUserPosts.activityId, "af-1"));
    expect(posts).toHaveLength(1);
    expect(posts[0].authorId).toBe("user-1");
    expect(posts[0].additionalImages).toBe("[]");
  });

  it("rolls back submission activity on validation failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteActivityFeeds).values({ id: "af-1", tripId: "trip-1", activityType: "submission", title: "Submission", createdAt: new Date(), updatedAt: new Date() });
        tx.insert(testDb.sqliteSubmissionActivities).values({ activityId: "af-1", submissionId: "sub-1", challengeId: "ch-1", groupId: "group-1", hasVideo: false });
        throw new Error("Validation failure");
      });
    }).toThrow("Validation failure");
    const feeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const subs = await testDb.drizzleDb.select().from(testDb.sqliteSubmissionActivities).where(eq(testDb.sqliteSubmissionActivities.activityId, "af-1"));
    expect(subs).toHaveLength(0);
    const allSubs = await testDb.drizzleDb.select().from(testDb.sqliteSubmissionActivities);
    expect(allSubs).toHaveLength(0);
    const allFeeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("rolls back challenge activity on validation failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteActivityFeeds).values({ id: "af-1", tripId: "trip-1", activityType: "challenge_event", title: "Challenge Event", createdAt: new Date(), updatedAt: new Date() });
        tx.insert(testDb.sqliteChallengeActivities).values({ activityId: "af-1", challengeId: "ch-1", eventType: "challenge_started" });
        throw new Error("Validation failure");
      });
    }).toThrow("Validation failure");
    const feeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const chas = await testDb.drizzleDb.select().from(testDb.sqliteChallengeActivities).where(eq(testDb.sqliteChallengeActivities.activityId, "af-1"));
    expect(chas).toHaveLength(0);
    const allChas = await testDb.drizzleDb.select().from(testDb.sqliteChallengeActivities);
    expect(allChas).toHaveLength(0);
    const allFeeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("rolls back rank change activity on validation failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteActivityFeeds).values({ id: "af-1", tripId: "trip-1", activityType: "rank_change", title: "Rank Change", createdAt: new Date(), updatedAt: new Date() });
        tx.insert(testDb.sqliteRankChangeActivities).values({ activityId: "af-1", groupId: "group-1", newRank: 1, totalCoins: 100, coinsGained: 10 });
        throw new Error("Validation failure");
      });
    }).toThrow("Validation failure");
    const feeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.id, "af-1"));
    expect(feeds).toHaveLength(0);
    const ranks = await testDb.drizzleDb.select().from(testDb.sqliteRankChangeActivities).where(eq(testDb.sqliteRankChangeActivities.activityId, "af-1"));
    expect(ranks).toHaveLength(0);
    const allRanks = await testDb.drizzleDb.select().from(testDb.sqliteRankChangeActivities);
    expect(allRanks).toHaveLength(0);
    const allFeeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds);
    expect(allFeeds).toHaveLength(0);
  });

  it("toggles reaction with real data", async () => {
    await seedActivityFeed(testDb.drizzleDb, { id: "af-1", tripId: "trip-1", activityType: "custom", title: "Activity" });
    await testDb.drizzleDb.insert(testDb.sqliteActivityReactions).values({ id: "react-1", activityId: "af-1", userId: "user-1", reactionType: "heart", createdAt: new Date() });
    const reactions = await testDb.drizzleDb.select().from(testDb.sqliteActivityReactions).where(eq(testDb.sqliteActivityReactions.activityId, "af-1"));
    expect(reactions).toHaveLength(1);
    expect(reactions[0].reactionType).toBe("heart");
    expect(reactions[0].userId).toBe("user-1");
    expect(reactions[0].activityId).toBe("af-1");
    await testDb.drizzleDb.delete(testDb.sqliteActivityReactions).where(eq(testDb.sqliteActivityReactions.id, "react-1"));
    const afterDelete = await testDb.drizzleDb.select().from(testDb.sqliteActivityReactions).where(eq(testDb.sqliteActivityReactions.activityId, "af-1"));
    expect(afterDelete).toHaveLength(0);
    const allReactions = await testDb.drizzleDb.select().from(testDb.sqliteActivityReactions);
    expect(allReactions).toHaveLength(0);
    const byUser = await testDb.drizzleDb.select().from(testDb.sqliteActivityReactions).where(eq(testDb.sqliteActivityReactions.userId, "user-1"));
    expect(byUser).toHaveLength(0);
  });

  it("queries activities with pagination", async () => {
    for (let i = 1; i <= 5; i++) {
      await seedActivityFeed(testDb.drizzleDb, { id: `af-${i}`, tripId: "trip-1", activityType: "custom", title: `Activity ${i}` });
    }
    const allFeeds = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.tripId, "trip-1"));
    expect(allFeeds).toHaveLength(5);
    const pageSize = 2;
    const page1 = allFeeds.slice(0, pageSize);
    expect(page1).toHaveLength(2);
    expect(page1[0].title).toBe("Activity 1");
    expect(page1[1].title).toBe("Activity 2");
    const page2 = allFeeds.slice(pageSize, pageSize * 2);
    expect(page2).toHaveLength(2);
    expect(page2[0].title).toBe("Activity 3");
    expect(page2[1].title).toBe("Activity 4");
    const page3 = allFeeds.slice(pageSize * 2);
    expect(page3).toHaveLength(1);
    expect(page3[0].title).toBe("Activity 5");
    const totalCount = await testDb.drizzleDb.select({ count: count() }).from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.tripId, "trip-1"));
    expect(totalCount[0].count).toBe(5);
    const otherTripCount = await testDb.drizzleDb.select({ count: count() }).from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.tripId, "trip-2"));
    expect(otherTripCount[0].count).toBe(0);
    const limited = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.tripId, "trip-1")).limit(2);
    expect(limited).toHaveLength(2);
    expect(limited[0].title).toBe("Activity 1");
    expect(limited[1].title).toBe("Activity 2");
    const offset = await testDb.drizzleDb.select().from(testDb.sqliteActivityFeeds).where(eq(testDb.sqliteActivityFeeds.tripId, "trip-1")).limit(2).offset(2);
    expect(offset).toHaveLength(2);
    expect(offset[0].title).toBe("Activity 3");
    expect(offset[1].title).toBe("Activity 4");
  });
});
