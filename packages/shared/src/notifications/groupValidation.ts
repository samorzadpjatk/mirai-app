import { ORPCError } from "@orpc/server";

export function validateGroupBelongsToTrip(
  group: { tripId: string; isDeleted: boolean } | null,
  tripId: string,
): void {
  if (!group || group.tripId !== tripId || group.isDeleted) {
    throw new ORPCError("NOT_FOUND", { message: "Group not found" });
  }
}

export function extractUserIdsFromParticipants(
  participants: Array<{ userId: string }>,
): string[] {
  return participants.map((p) => p.userId);
}
