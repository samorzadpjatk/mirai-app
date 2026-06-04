import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";
import { users } from "./users";

/**
 * Operational telemetry table — NOT user-facing business data.
 * Used for update rollout analysis and platform detection.
 * Not part of the app's business data model.
 *
 * This table is populated by the mobileAppMiddleware in every request
 * and is NOT consumed by the native app.
 */
export const userAgents = pgTable(
  "user_agents",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userAgent: text("user_agent").notNull(),
    platform: text("platform").notNull(),
    userId: varchar("user_id", { length: 36 }).references(() => users.id),
    endpoint: text("endpoint"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("user_agents_timestamp_idx").on(t.timestamp),
    index("user_agents_platform_idx").on(t.platform),
    index("user_agents_user_id_idx").on(t.userId),
    index("user_agents_user_agent_idx").on(t.userAgent),
  ],
);
