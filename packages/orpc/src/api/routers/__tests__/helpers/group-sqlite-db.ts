import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import {
  groupSchemaSql,
  sqliteUsers,
  sqliteTrips,
  sqliteGroups,
  sqliteTripParticipants,
  sqliteGroupJoinRequests,
  sqliteCoinTransactions,
  sqliteChallengeSubmissions,
  sqliteActivityFeeds,
  sqliteRankChangeActivities,
} from "./group-sqlite-schema";

export function createTestDb() {
  const db = new Database(":memory:");

  db.exec(groupSchemaSql);

  const drizzleDb = drizzle(db, {
    schema: {
      sqliteUsers,
      sqliteTrips,
      sqliteGroups,
      sqliteTripParticipants,
      sqliteGroupJoinRequests,
      sqliteCoinTransactions,
      sqliteChallengeSubmissions,
      sqliteActivityFeeds,
      sqliteRankChangeActivities,
    },
  });

  return {
    db,
    drizzleDb,
    sqliteUsers,
    sqliteTrips,
    sqliteGroups,
    sqliteTripParticipants,
    sqliteGroupJoinRequests,
    sqliteCoinTransactions,
    sqliteChallengeSubmissions,
    sqliteActivityFeeds,
    sqliteRankChangeActivities,
  };
}
