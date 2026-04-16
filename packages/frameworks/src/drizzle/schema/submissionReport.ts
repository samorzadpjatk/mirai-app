import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { challengeSubmissions } from "./challenge";
import { users } from "./user";

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
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  reviewedById: uuid("reviewedById").references(() => users.id),
  reviewedAt: timestamp("reviewedAt", { mode: "date" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
});

export type SubmissionReportInsert = typeof submissionReports.$inferInsert;
export type SubmissionReportSelect = typeof submissionReports.$inferSelect;
