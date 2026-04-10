import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { challengeSubmissions } from "./challenge";

/**
 * Submission Reports table - matches Prisma SubmissionReport model
 */
export const submissionReports = pgTable("SubmissionReport", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submissionId")
    .notNull()
    .references(() => challengeSubmissions.id, { onDelete: "cascade" }),
  reporterId: uuid("reporterId").notNull(),
  reason: varchar("reason", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
});

export type SubmissionReportInsert = typeof submissionReports.$inferInsert;
export type SubmissionReportSelect = typeof submissionReports.$inferSelect;
