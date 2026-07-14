import { rooms, tripParticipants } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, count, eq, ne } from "drizzle-orm";
import type { RoomContext } from "./queries";

/** Number of participants currently assigned to a room (optionally excluding one user). */
const countOccupants = async (context: RoomContext, roomId: string, excludeUserId?: string) => {
  const whereExpr = excludeUserId
    ? and(eq(tripParticipants.roomId, roomId), ne(tripParticipants.userId, excludeUserId))
    : eq(tripParticipants.roomId, roomId);
  const [row] = await context.db
    .select({ count: count(tripParticipants.id) })
    .from(tripParticipants)
    .where(whereExpr);
  return row?.count ?? 0;
};

const requireRoomInTrip = async (context: RoomContext, roomId: string, tripId: string) => {
  const room = await context.db.query.rooms.findFirst({
    where: (r, { eq }) => eq(r.id, roomId),
    columns: { id: true, tripId: true, capacity: true, isDeleted: true },
  });
  if (!room || room.isDeleted) throw new ORPCError("NOT_FOUND", { message: "Pokój nie istnieje" });
  if (room.tripId !== tripId)
    throw new ORPCError("BAD_REQUEST", { message: "Pokój nie z tego wyjazdu" });
  return room;
};

export const create = async (
  context: RoomContext,
  input: { tripId: string; name: string; capacity: number },
) => {
  const [room] = await context.db
    .insert(rooms)
    .values({ tripId: input.tripId, name: input.name, capacity: input.capacity })
    .returning();
  return room;
};

export const update = async (
  context: RoomContext,
  input: { id: string; name?: string; capacity?: number },
) => {
  const room = await context.db.query.rooms.findFirst({
    where: (r, { eq }) => eq(r.id, input.id),
    columns: { id: true, isDeleted: true },
  });
  if (!room || room.isDeleted) throw new ORPCError("NOT_FOUND", { message: "Pokój nie istnieje" });

  if (input.capacity !== undefined) {
    const occupants = await countOccupants(context, input.id);
    if (input.capacity < occupants) {
      throw new ORPCError("CONFLICT", {
        message: `Pojemność (${input.capacity}) jest mniejsza niż liczba przypisanych osób (${occupants}).`,
      });
    }
  }

  const [updated] = await context.db
    .update(rooms)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
    })
    .where(eq(rooms.id, input.id))
    .returning();
  return updated;
};

export const deleteRoom = async (context: RoomContext, input: { id: string }) => {
  return await context.db.transaction(async (tx) => {
    const [room] = await tx
      .update(rooms)
      .set({ isDeleted: true })
      .where(eq(rooms.id, input.id))
      .returning();
    if (!room) throw new ORPCError("NOT_FOUND", { message: "Pokój nie istnieje" });
    // Detach occupants so they are no longer shown in a deleted room.
    await tx
      .update(tripParticipants)
      .set({ roomId: null })
      .where(eq(tripParticipants.roomId, input.id));
    return { id: room.id };
  });
};

export const assignUserToRoom = async (
  context: RoomContext,
  input: { userId: string; tripId: string; roomId: string },
) => {
  const room = await requireRoomInTrip(context, input.roomId, input.tripId);

  // Hard capacity block (exclude the user being (re)assigned so re-assign is idempotent).
  const occupants = await countOccupants(context, input.roomId, input.userId);
  if (occupants >= room.capacity) {
    throw new ORPCError("CONFLICT", { message: "Pokój jest pełny" });
  }

  const [participant] = await context.db
    .insert(tripParticipants)
    .values({ userId: input.userId, tripId: input.tripId, roomId: input.roomId })
    .onConflictDoUpdate({
      target: [tripParticipants.userId, tripParticipants.tripId],
      set: { roomId: input.roomId },
    })
    .returning();
  return participant;
};

export const bulkAssignUsersToRoom = async (
  context: RoomContext,
  input: { tripId: string; roomId: string; userIds: string[] },
) => {
  const room = await requireRoomInTrip(context, input.roomId, input.tripId);
  const uniqueUserIds = Array.from(new Set(input.userIds));

  return await context.db.transaction(async (tx) => {
    // Occupants already in the room that are NOT part of this batch keep their spot.
    const currentOthers = await tx
      .select({ userId: tripParticipants.userId })
      .from(tripParticipants)
      .where(eq(tripParticipants.roomId, input.roomId));
    const keptOthers = currentOthers.filter((row) => !uniqueUserIds.includes(row.userId)).length;

    if (keptOthers + uniqueUserIds.length > room.capacity) {
      throw new ORPCError("CONFLICT", {
        message: `Pokój pomieści ${room.capacity} osób — próba przypisania ${keptOthers + uniqueUserIds.length}.`,
      });
    }

    await Promise.all(
      uniqueUserIds.map((userId) =>
        tx
          .insert(tripParticipants)
          .values({ userId, tripId: input.tripId, roomId: input.roomId })
          .onConflictDoUpdate({
            target: [tripParticipants.userId, tripParticipants.tripId],
            set: { roomId: input.roomId },
          }),
      ),
    );

    return { count: uniqueUserIds.length };
  });
};

export const removeUserFromRoom = async (
  context: RoomContext,
  input: { userId: string; tripId: string },
) => {
  const [participant] = await context.db
    .update(tripParticipants)
    .set({ roomId: null })
    .where(
      and(eq(tripParticipants.userId, input.userId), eq(tripParticipants.tripId, input.tripId)),
    )
    .returning();
  if (!participant) throw new ORPCError("NOT_FOUND", { message: "Uczestnik nie istnieje" });
  return { userId: participant.userId };
};
