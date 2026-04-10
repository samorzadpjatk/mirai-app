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

// Export all schemas as they are created
// Currently: User schema is defined
export * from "./user";

// TODO: Add more schemas as entities are migrated
// export * from "./group";
// export * from "./trip";
// export * from "./challenge";
// export * from "./event";
// export * from "./location";
// export * from "./challengeSubmission";
// export * from "./activityFeed";
// export * from "./notification";
