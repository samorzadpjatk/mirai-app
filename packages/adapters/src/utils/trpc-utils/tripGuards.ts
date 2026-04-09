import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@mirai-app/frameworks/prisma";

/**
 * Ensures that a trip has not ended (beyond the 24-hour grace period).
 * Throws a FORBIDDEN error if the trip has ended.
 *
 * @param db - Prisma client instance
 * @param tripId - The ID of the trip to check
 * @throws {TRPCError} - If trip has ended
 */
export async function ensureTripNotEnded(
  db: PrismaClient,
  tripId: string,
): Promise<void> {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    select: { endDate: true },
  });

  if (!trip) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trip not found",
    });
  }

  // Check if trip has ended (beyond 24-hour grace period)
  const endDate = new Date(trip.endDate);
  const gracePeriodEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after end
  const now = new Date();

  if (now.getTime() > gracePeriodEnd.getTime()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Trip has ended",
    });
  }
}

/**
 * Resolves tripId from a groupId and ensures the trip has not ended.
 * This is a convenience function for mutations that receive groupId instead of tripId.
 *
 * @param db - Prisma client instance
 * @param groupId - The ID of the group to look up the trip for
 * @returns {Promise<string>} - The tripId
 * @throws {TRPCError} - If group not found or trip has ended
 */
export async function ensureTripNotEndedByGroupId(
  db: PrismaClient,
  groupId: string,
): Promise<string> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { tripId: true, isDeleted: true },
  });

  if (!group || group.isDeleted) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Group not found",
    });
  }

  // Ensure the trip hasn't ended
  await ensureTripNotEnded(db, group.tripId);

  return group.tripId;
}
