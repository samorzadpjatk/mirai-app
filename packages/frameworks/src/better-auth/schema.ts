/**
 * Better Auth Database Schema
 *
 * This file defines the Drizzle schema for Better Auth tables.
 * Table names are prefixed with "better_auth_" to avoid conflicts
 * with existing application tables.
 *
 * Required tables:
 * - better_auth_user: User accounts
 * - better_auth_session: Active sessions
 * - better_auth_account: OAuth provider connections
 * - better_auth_verification: OTP codes and email verification tokens
 *
 * @see https://www.better-auth.com/docs/concepts/database
 */

import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  index,
} from "drizzle-orm/pg-core";

/**
 * Better Auth User Table
 *
 * Stores user account information for Better Auth authentication.
 * Note: This is separate from the application's `users` table to maintain
 * clean separation between auth system and application domain.
 *
 * Fields:
 * - id: Unique identifier for the user
 * - email: User's email address (unique)
 * - emailVerified: Whether the email has been verified
 * - name: Display name
 * - image: Profile image URL (optional)
 * - createdAt: Account creation timestamp
 * - updatedAt: Last update timestamp
 */
export const betterAuthUser = pgTable(
  "better_auth_user",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: varchar("name", { length: 255 }).notNull(),
    image: varchar("image", { length: 2048 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("better_auth_user_email_idx").on(table.email),
    index("better_auth_user_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Better Auth Session Table
 *
 * Stores active user sessions for cookie-based authentication.
 *
 * Fields:
 * - id: Unique session identifier
 * - token: Unique session token (used in cookies)
 * - userId: Reference to the user
 * - expiresAt: Session expiration timestamp
 * - ipAddress: Client IP address (optional)
 * - userAgent: Client user agent string (optional)
 * - createdAt: Session creation timestamp
 * - updatedAt: Last update timestamp
 */
export const betterAuthSession = pgTable(
  "better_auth_session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("better_auth_session_token_idx").on(table.token),
    index("better_auth_session_user_id_idx").on(table.userId),
    index("better_auth_session_expires_at_idx").on(table.expiresAt),
  ],
);

/**
 * Better Auth Account Table
 *
 * Stores OAuth provider connections and credentials.
 * Also used for email/password accounts (password field).
 *
 * Fields:
 * - id: Unique account identifier
 * - userId: Reference to the user
 * - accountId: Provider-specific account ID
 * - providerId: OAuth provider identifier (e.g., "google", "github")
 * - accessToken: OAuth access token (optional)
 * - refreshToken: OAuth refresh token (optional)
 * - accessTokenExpiresAt: Access token expiration (optional)
 * - refreshTokenExpiresAt: Refresh token expiration (optional)
 * - scope: OAuth scope (optional)
 * - idToken: OAuth ID token (optional)
 * - password: Hashed password for email/password auth (optional)
 * - createdAt: Account creation timestamp
 * - updatedAt: Last update timestamp
 */
export const betterAuthAccount = pgTable(
  "better_auth_account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => betterAuthUser.id, { onDelete: "cascade" }),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: "date" }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("better_auth_account_user_id_idx").on(table.userId),
    index("better_auth_account_provider_idx").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

/**
 * Better Auth Verification Table
 *
 * Stores OTP codes and email verification tokens.
 *
 * Fields:
 * - id: Unique verification identifier
 * - identifier: Verification type/identifier (e.g., email address for OTP)
 * - value: The verification code/token
 * - expiresAt: Token expiration timestamp
 * - createdAt: Creation timestamp
 * - updatedAt: Last update timestamp
 */
export const betterAuthVerification = pgTable(
  "better_auth_verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: varchar("value", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("better_auth_verification_identifier_idx").on(table.identifier),
    index("better_auth_verification_expires_at_idx").on(table.expiresAt),
  ],
);

/**
 * Type for inserting a Better Auth user
 */
export type BetterAuthUserInsert = typeof betterAuthUser.$inferInsert;

/**
 * Type for selecting a Better Auth user
 */
export type BetterAuthUserSelect = typeof betterAuthUser.$inferSelect;

/**
 * Type for inserting a Better Auth session
 */
export type BetterAuthSessionInsert = typeof betterAuthSession.$inferInsert;

/**
 * Type for selecting a Better Auth session
 */
export type BetterAuthSessionSelect = typeof betterAuthSession.$inferSelect;

/**
 * Type for inserting a Better Auth account
 */
export type BetterAuthAccountInsert = typeof betterAuthAccount.$inferInsert;

/**
 * Type for selecting a Better Auth account
 */
export type BetterAuthAccountSelect = typeof betterAuthAccount.$inferSelect;

/**
 * Type for inserting a Better Auth verification
 */
export type BetterAuthVerificationInsert =
  typeof betterAuthVerification.$inferInsert;

/**
 * Type for selecting a Better Auth verification
 */
export type BetterAuthVerificationSelect =
  typeof betterAuthVerification.$inferSelect;
