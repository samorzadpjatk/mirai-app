import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

/**
 * Role enum - matches Prisma Role enum exactly
 */
export const roleEnum = pgEnum("Role", [
  "USER",
  "ADMIN",
  "MODERATOR",
  "SERVICE",
]);

/**
 * Users table - matches Prisma User model exactly
 *
 * Note: This schema mirrors the Prisma schema for dual-ORM coexistence.
 * All column names match Prisma's database column names.
 */
export const users = pgTable(
  "User",
  {
    // Primary identifier
    id: uuid("id").primaryKey().defaultRandom(),

    // Authentication
    authUserId: varchar("authUserId", { length: 255 }).notNull().unique(),

    // Profile information
    firstName: varchar("firstName", { length: 255 }).notNull(),
    lastName: varchar("lastName", { length: 255 }).notNull(),
    hasAvatar: boolean("hasAvatar").notNull().default(false),

    // Role and permissions
    role: roleEnum("role").notNull().default("USER"),

    // Timestamps
    lastSeenOn: timestamp("last_seen_on", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite index for cursor pagination on createdAt
    index("users_created_at_id_idx").on(table.createdAt, table.id),
  ],
);

/**
 * Type for inserting a user
 */
export type UserInsert = typeof users.$inferInsert;

/**
 * Type for selecting a user
 */
export type UserSelect = typeof users.$inferSelect;
