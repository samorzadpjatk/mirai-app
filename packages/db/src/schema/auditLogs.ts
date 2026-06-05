import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { users } from "./users";

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id", { length: 36 }).notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  oldValues: text("old_values"), // JSON
  newValues: text("new_values"), // JSON
  performedById: varchar("performed_by_id", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
});
