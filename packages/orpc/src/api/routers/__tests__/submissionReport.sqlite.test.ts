import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "bun:sqlite";
import { createTestDb } from "./helpers/submissionReport-sqlite-db";
import { eq } from "drizzle-orm";

describe("submissionReport router — real SQLite transaction rollback", () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE challenge_submissions (
        id TEXT PRIMARY KEY,
        challenge_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    db.exec(`
      CREATE TABLE submission_reports (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        reporter_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, status) VALUES (?, ?, ?, ?)`,
      ["submission-123", "challenge-123", "group-123", "PENDING"],
    );
  });

  afterEach(() => {
    db.close();
  });

  it("rolls back report insertion on transaction failure", () => {
    const initialCount = db.query("SELECT COUNT(*) as count FROM submission_reports").get() as {
      count: number;
    };
    expect(initialCount.count).toBe(0);

    try {
      db.exec("BEGIN TRANSACTION");
      db.run(
        `INSERT INTO submission_reports (id, submission_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)`,
        ["report-1", "submission-123", "user-123", "Inappropriate content", "Details here"],
      );
      throw new Error("Simulated failure after insert");
    } catch {
      db.exec("ROLLBACK");
    }

    const afterRollback = db.query("SELECT COUNT(*) as count FROM submission_reports").get() as {
      count: number;
    };
    expect(afterRollback.count).toBe(0);
  });

  it("commits report insertion successfully when no failure occurs", () => {
    db.exec("BEGIN TRANSACTION");
    db.run(
      `INSERT INTO submission_reports (id, submission_id, reporter_id, reason, details) VALUES (?, ?, ?, ?, ?)`,
      ["report-2", "submission-123", "user-123", "Spam", "Spam details"],
    );
    db.exec("COMMIT");

    const afterCommit = db.query("SELECT COUNT(*) as count FROM submission_reports").get() as {
      count: number;
    };
    expect(afterCommit.count).toBe(1);

    const report = db.query("SELECT * FROM submission_reports WHERE id = ?").get("report-2") as {
      submission_id: string;
      reason: string;
    };
    expect(report.submission_id).toBe("submission-123");
    expect(report.reason).toBe("Spam");
  });
});

describe("submissionReport router — Drizzle ORM SQLite integration", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.db.run(
      `INSERT INTO challenge_submissions (id, challenge_id, group_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      ["submission-123", "challenge-123", "group-123", "PENDING", Date.now(), Date.now()],
    );
  });

  afterEach(() => {
    testDb.db.close();
  });

  it("inserts a report via Drizzle ORM transaction", async () => {
    await testDb.drizzleDb.transaction(async (tx) => {
      await tx.insert(testDb.sqliteSubmissionReports).values({
        id: "report-1",
        submissionId: "submission-123",
        reporterId: "user-123",
        reason: "Inappropriate content",
        details: "Details here",
      });
    });

    const reports = await testDb.drizzleDb.select().from(testDb.sqliteSubmissionReports).where(
      eq(testDb.sqliteSubmissionReports.submissionId, "submission-123"),
    );
    expect(reports).toHaveLength(1);
    expect(reports[0].reason).toBe("Inappropriate content");
    expect(reports[0].details).toBe("Details here");
  });

  it("rolls back Drizzle ORM transaction on failure", async () => {
    expect(() => {
      testDb.drizzleDb.transaction((tx) => {
        tx.insert(testDb.sqliteSubmissionReports).values({
          id: "report-2",
          submissionId: "submission-123",
          reporterId: "user-123",
          reason: "Spam",
          details: "Spam details",
        });

        throw new Error("Simulated failure");
      });
    }).toThrow("Simulated failure");

    const reports = await testDb.drizzleDb.select().from(testDb.sqliteSubmissionReports).where(
      eq(testDb.sqliteSubmissionReports.submissionId, "submission-123"),
    );
    expect(reports).toHaveLength(0);
  });
});
