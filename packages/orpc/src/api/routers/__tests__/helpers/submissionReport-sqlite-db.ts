import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteChallengeSubmissions, sqliteSubmissionReports } from "./submissionReport-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS submission_reports (
      id TEXT PRIMARY KEY,
      submission_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  const drizzleDb = drizzle(db, { schema: { sqliteChallengeSubmissions, sqliteSubmissionReports } });

  return { db, drizzleDb, sqliteChallengeSubmissions, sqliteSubmissionReports };
}
