import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteChallenges, sqliteChallengeSubmissions, sqliteChallengeVotes } from "./challengeVote-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
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
    CREATE TABLE IF NOT EXISTS challenge_submissions (
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
    CREATE TABLE IF NOT EXISTS challenge_votes (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      submission_id TEXT NOT NULL,
      voter_id TEXT NOT NULL,
      vote_position INTEGER NOT NULL,
      vote_points INTEGER NOT NULL,
      normalized_weight REAL DEFAULT 1.0 NOT NULL,
      voted_at INTEGER NOT NULL
    )
  `);

  const drizzleDb = drizzle(db, {
    schema: { sqliteChallenges, sqliteChallengeSubmissions, sqliteChallengeVotes },
  });

  return { db, drizzleDb, sqliteChallenges, sqliteChallengeSubmissions, sqliteChallengeVotes };
}
