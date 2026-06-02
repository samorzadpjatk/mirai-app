import { eq, and } from "drizzle-orm";
import { groups } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";

/**
 * Fetches non-deleted group IDs for a given trip.
 * Async helper (not pure) — extracted to eliminate duplication across queries.
 */
export async function fetchGroupIdsForTrip(db: DB, tripId: string): Promise<string[]> {
  const groupIds = await db
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)));

  return groupIds.map((g) => g.id);
}
