import { ORPCError } from "@orpc/server";
import type { DB } from "@mirai-app/db";

export async function ensureTripNotEnded(
  db: DB,
  tripId: string,
): Promise<void> {
  const trip = await db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, tripId),
  });

  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  const endDate = new Date(trip.endDate);
  const gracePeriodEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now.getTime() > gracePeriodEnd.getTime()) {
    throw new ORPCError("FORBIDDEN", { message: "Trip has ended" });
  }
}

export async function ensureTripNotEndedByGroupId(
  db: DB,
  groupId: string,
): Promise<string> {
  const group = await db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.id, groupId),
  });

  if (!group || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }

  await ensureTripNotEnded(db, group.tripId);

  return group.tripId;
}
