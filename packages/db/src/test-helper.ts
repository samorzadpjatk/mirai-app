import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import type { PGlite as PGliteType } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";

export type TestDB = ReturnType<typeof createPgliteTestDb>;

/**
 * Creates an in-memory PostgreSQL database using PGLite for testing.
 * Uses the production schema to avoid schema drift.
 * 
 * Benefits over SQLite:
 * - Same pg-core schema as production (no separate sqlite schemas)
 * - Same type hierarchy as PostgresJsDatabase (no need for as unknown as DB)
 * - Real PostgreSQL behavior in-memory
 * - No Docker required
 * 
 * @example
 * ```ts
 * const { db, cleanup } = createPgliteTestDb();
 * // Use db for tests
 * await cleanup();
 * ```
 */
export async function createPgliteTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // Apply schema using drizzle-kit push approach
  // We use raw SQL to create all tables since we don't have migration files
  // This is a test database so we don't need to be as precise
  await pushSchema(client);

  return {
    db,
    client,
    cleanup: async () => {
      await client.close();
    },
    reset: async () => {
      // Reset all tables for clean state between tests
      const tables = [
        "users", "trips", "trip_resources", "trip_insurances", "trip_insurance_steps",
        "trip_participants", "events", "user_events", "groups", "group_join_requests",
        "challenges", "challenge_submissions", "challenge_votes", "submission_reports",
        "activity_feeds", "activity_reactions", "challenge_activities", "rank_change_activities",
        "submission_activities", "user_posts", "notifications", "notification_pushes",
        "notification_deliveries", "notification_schedules", "notification_schedule_executions",
        "push_subscriptions", "locations", "location_sharing_requests", "location_shares",
        "rewards", "reward_purchases", "coin_transactions", "sponsors", "trip_sponsors", "user_agents",
      ];
      for (const table of tables) {
        await db.execute(sql`TRUNCATE TABLE ${sql.raw(table)} CASCADE`);
      }
    },
  };
}

/**
 * Pushes the production schema to a PGLite client.
 * Uses drizzle-kit's API to generate and apply the schema.
 */
async function pushSchema(client: PGliteType) {
  // Import drizzle-kit API dynamically to avoid issues
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  
  try {
    const { pushSchema: pushSchemaApi } = require("drizzle-kit/api");
    const db = drizzle(client, { schema });
    
    const { apply } = await pushSchemaApi(schema, db, undefined, undefined, undefined);
    await apply();
  } catch (error) {
    console.warn("drizzle-kit pushSchema API failed, using manual schema push", error);
    await applySchemaManually(client);
  }
}

async function applySchemaManually(client: PGliteType) {
  // This is a simplified approach for when drizzle-kit API is unavailable
  // In production, we rely on drizzle-kit's generate and push
  // For tests, we just need the tables to exist
  const { getTableConfig } = await import("drizzle-orm/pg-core");
  
  // Create tables for each schema definition
  const tables = [
    schema.users,
    schema.trips,
    schema.tripResources,
    schema.tripInsurances,
    schema.tripInsuranceSteps,
    schema.tripParticipants,
    schema.events,
    schema.userEvents,
    schema.groups,
    schema.groupJoinRequests,
    schema.challenges,
    schema.challengeSubmissions,
    schema.challengeVotes,
    schema.submissionReports,
    schema.activityFeeds,
    schema.activityReactions,
    schema.challengeActivities,
    schema.rankChangeActivities,
    schema.submissionActivities,
    schema.userPosts,
    schema.notifications,
    schema.notificationPushes,
    schema.notificationDeliveries,
    schema.notificationSchedules,
    schema.notificationScheduleExecutions,
    schema.pushSubscriptions,
    schema.locations,
    schema.locationSharingRequests,
    schema.locationShares,
    schema.rewards,
    schema.rewardPurchases,
    schema.coinTransactions,
    schema.sponsors,
    schema.tripSponsors,
    schema.userAgents,
  ];
  
  for (const table of tables) {
    if (table) {
      const config = getTableConfig(table);
      const columns = config.columns.map(col => {
        const type = col.getSQLType();
        const notNull = col.notNull ? " NOT NULL" : "";
        const defaultValue = col.hasDefault ? ` DEFAULT ${col.defaultValue}` : "";
        const primaryKey = col.primaryKey ? " PRIMARY KEY" : "";
        return `${col.name} ${type}${notNull}${defaultValue}${primaryKey}`;
      }).join(", ");
      
      const sql = `CREATE TABLE IF NOT EXISTS "${config.name}" (${columns})`;
      await client.query(sql);
    }
  }
}
