/**
 * Drizzle ORM Framework Setup
 *
 * This module provides the Drizzle ORM client and schema for database access.
 * It mirrors the Prisma setup to enable dual-ORM coexistence during migration.
 *
 * Phase 1 Migration Strategy:
 * 1. Create Drizzle schemas matching Prisma exactly
 * 2. Implement repositories extending BaseDrizzleRepository
 * 3. Add mapper methods for Drizzle conversion
 * 4. Register in DI container with feature flag
 * 5. Run parallel validation (read from both, compare, return Prisma)
 * 6. Enable Drizzle writes after validation period
 * 7. Remove Prisma repository after 48-hour stability
 */

export { createDrizzleClient, type DrizzleDb } from "./client";
export * from "./schema";
