import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sqliteChallengeSubmissions = sqliteTable("challenge_submissions", {
  id: text("id").primaryKey(),
  challengeId: text("challenge_id").notNull(),
  groupId: text("group_id").notNull(),
  status: text("status").default("PENDING").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const sqliteSubmissionReports = sqliteTable("submission_reports", {
  id: text("id").primaryKey(),
  submissionId: text("submission_id").notNull(),
  reporterId: text("reporter_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
