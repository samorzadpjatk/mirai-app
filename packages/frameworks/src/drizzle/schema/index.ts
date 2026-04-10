/**
 * Drizzle Schema Index
 *
 * This file exports all Drizzle table schemas for the application.
 * Schemas are organized by domain entity and mirror the Prisma schema.
 *
 * Migration Strategy:
 * - Each entity schema is created to match the Prisma schema exactly
 * - Tables use the same names and column names as Prisma
 * - Migration is done entity by entity
 * - Dual-ORM coexistence allows gradual migration
 */

// User schema (first migrated entity)
export * from "./user";

// Trip and related schemas
export * from "./trip";

// Group and related schemas
export * from "./group";

// Challenge and related schemas
export * from "./challenge";

// Event schemas
export * from "./event";

// Location schemas
export * from "./location";

// Activity Feed schemas
export * from "./activityFeed";

// Notification schemas
export * from "./notification";

// Reward schemas
export * from "./reward";
