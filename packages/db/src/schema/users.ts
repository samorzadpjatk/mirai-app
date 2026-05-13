import { pgTable, varchar, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { roleEnum } from "./enums";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  authUserId: text("auth_user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  hasAvatar: boolean("has_avatar").default(false).notNull(),
  role: roleEnum("role").default("USER").notNull(),
  lastSeenOn: timestamp("last_seen_on", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});
