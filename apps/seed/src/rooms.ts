import { logger } from "@mirai-app/common/utils";
import { rooms, tripParticipants } from "@mirai-app/db";
import { and, eq, inArray } from "drizzle-orm";
import yaml from "yaml";
import { db } from "./config/db";
import type { AuthUserByEmail, RoomConfig } from "./types";
import { readTextFile } from "./utils/fs";
import { joinPath } from "./utils/path";

function isRoomConfig(value: unknown): value is RoomConfig {
  if (typeof value !== "object" || value === null) return false;
  const room = value as Record<string, unknown>;
  return typeof room.name === "string" && typeof room.capacity === "number" && room.capacity > 0;
}

export const loadRoomConfigs = async (
  envRoot: string,
  roomsPath: string,
): Promise<RoomConfig[]> => {
  const fullPath = joinPath(envRoot, roomsPath);
  const content = await readTextFile(fullPath);
  const parsed: unknown = yaml.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error(`Rooms config must be an array: ${fullPath}`);
  }
  return parsed.filter(isRoomConfig);
};

export const seedRooms = async (
  roomConfigs: RoomConfig[],
  tripId: string,
  authUsers: AuthUserByEmail,
) => {
  // Idempotent: detach occupants and drop existing rooms for this trip first.
  const existing = await db.query.rooms.findMany({
    where: (r, { eq }) => eq(r.tripId, tripId),
    columns: { id: true },
  });
  if (existing.length > 0) {
    const ids = existing.map((r) => r.id);
    await db
      .update(tripParticipants)
      .set({ roomId: null })
      .where(inArray(tripParticipants.roomId, ids));
    await db.delete(rooms).where(inArray(rooms.id, ids));
  }

  for (const roomConfig of roomConfigs) {
    try {
      const [room] = await db
        .insert(rooms)
        .values({ tripId, name: roomConfig.name, capacity: roomConfig.capacity })
        .returning();
      if (!room) continue;

      const members = roomConfig.members ?? [];
      if (members.length > roomConfig.capacity) {
        logger.warn(
          `⚠ Room "${roomConfig.name}" lists ${members.length} members but capacity is ${roomConfig.capacity}`,
        );
      }

      let assigned = 0;
      for (const email of members) {
        const authUser = authUsers.get(email.trim().toLowerCase());
        if (!authUser) continue;
        const user = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.authUserId, authUser.id),
          columns: { id: true },
        });
        if (!user) continue;
        await db
          .update(tripParticipants)
          .set({ roomId: room.id })
          .where(and(eq(tripParticipants.userId, user.id), eq(tripParticipants.tripId, tripId)));
        assigned += 1;
      }

      logger.info(`✓ Seeded room: ${roomConfig.name} (${assigned}/${roomConfig.capacity} beds)`);
    } catch (error) {
      logger.error(error, `✗ Failed to seed room ${roomConfig.name}`);
    }
  }
};
