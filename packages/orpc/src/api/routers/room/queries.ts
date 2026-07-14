import { calculatePagination } from "@mirai-app/common/groups";
import type { DB } from "@mirai-app/db";
import { rooms } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { ORPCError } from "@orpc/server";
import { and, count, eq } from "drizzle-orm";
import { buildAuthEmailLookup } from "../../../utils/authEmails";
import { toUserWithEmail } from "../group/utils";

export type RoomContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string; role: string };
};

/** Ensure the caller is a participant of the trip — prevents cross-trip data disclosure (IDOR). */
const requireTripMembership = async (context: RoomContext, tripId: string) => {
  const membership = await context.db.query.tripParticipants.findFirst({
    where: (tp, { and, eq }) => and(eq(tp.tripId, tripId), eq(tp.userId, context.dbUser.id)),
    columns: { id: true },
  });
  if (!membership) {
    throw new ORPCError("FORBIDDEN", { message: "You are not a participant of this trip" });
  }
};

const participantUserColumns = {
  id: true,
  firstName: true,
  lastName: true,
  authUserId: true,
} as const;

const mapRoomParticipants = async (
  supabase: SupabaseClient,
  roomList: {
    participants: { user: { authUserId: string } }[];
  }[],
) => {
  const authUserIds = roomList.flatMap((room) =>
    room.participants.map((participant) => participant.user.authUserId),
  );
  return buildAuthEmailLookup(supabase, authUserIds);
};

export const getAll = async (
  context: RoomContext,
  input: {
    tripId: string;
    pagination?: { limit: number; offset: number };
  },
) => {
  await requireTripMembership(context, input.tripId);

  const limit = input.pagination?.limit ?? 30;
  const offset = input.pagination?.offset ?? 0;
  const whereExpr = and(eq(rooms.tripId, input.tripId), eq(rooms.isDeleted, false));

  const [roomsResult, totalResult] = await Promise.all([
    context.db.query.rooms.findMany({
      where: whereExpr,
      with: {
        participants: {
          with: { user: { columns: participantUserColumns } },
        },
      },
      orderBy: (r, { asc }) => [asc(r.name)],
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(rooms).where(whereExpr),
  ]);

  const emailByAuthUserId = await mapRoomParticipants(context.supabase, roomsResult);

  return {
    rooms: roomsResult.map((room) => ({
      ...room,
      occupancy: room.participants.length,
      participants: room.participants.map((participant) => ({
        ...participant,
        user: toUserWithEmail(participant.user, emailByAuthUserId),
      })),
    })),
    pagination: calculatePagination(limit, offset, totalResult[0]?.count ?? 0),
  };
};

export const getById = async (context: RoomContext, input: { id: string }) => {
  const room = await context.db.query.rooms.findFirst({
    where: (r, { eq }) => eq(r.id, input.id),
    with: {
      participants: {
        with: { user: { columns: participantUserColumns } },
      },
    },
  });

  if (!room || room.isDeleted) return null;

  await requireTripMembership(context, room.tripId);

  const emailByAuthUserId = await buildAuthEmailLookup(
    context.supabase,
    room.participants.map((participant) => participant.user.authUserId),
  );

  return {
    ...room,
    occupancy: room.participants.length,
    participants: room.participants.map((participant) => ({
      ...participant,
      user: toUserWithEmail(participant.user, emailByAuthUserId),
    })),
  };
};
