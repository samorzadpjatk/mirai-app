import type { SupabaseUser } from "@mirai-app/supabase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadRoomConfigs, seedRooms } from "../rooms";
import type { AuthUserByEmail, RoomConfig } from "../types";

const mockReadTextFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));

const mockRoomsFindMany = vi.fn();
const mockUserFindFirst = vi.fn();
const mockRoomInsert = vi.fn();
const mockRoomDelete = vi.fn();
const mockParticipantUpdate = vi.fn();

vi.mock("../utils/fs", () => ({
  readTextFile: (path: string) => mockReadTextFile(path) as Promise<string>,
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
}));

vi.mock("yaml", () => ({
  default: {
    parse: (content: string): unknown => {
      if (!content.trim()) return [];
      try {
        return JSON.parse(content) as unknown;
      } catch {
        return [];
      }
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  and: (...args: unknown[]) => ({ __op: "and", args }),
  eq: (column: unknown, value: unknown) => ({ __op: "eq", column, value }),
  inArray: (column: unknown, values: unknown) => ({ __op: "inArray", column, values }),
}));

vi.mock("@mirai-app/db", () => ({
  rooms: { __table: "rooms", id: { name: "id" } },
  tripParticipants: {
    __table: "tripParticipants",
    userId: { name: "userId" },
    tripId: { name: "tripId" },
    roomId: { name: "roomId" },
  },
}));

vi.mock("../config/db", () => ({
  db: {
    query: {
      rooms: {
        findMany: (...args: unknown[]) => mockRoomsFindMany(...args) as Promise<{ id: string }[]>,
      },
      users: {
        findFirst: (...args: unknown[]) =>
          mockUserFindFirst(...args) as Promise<{ id: string } | null>,
      },
    },
    update: (table: { __table?: string }) => ({
      set: (data: unknown) => ({
        where: (condition: unknown) => {
          mockParticipantUpdate({ table: table?.__table, data, condition });
          return Promise.resolve({});
        },
      }),
    }),
    delete: (table: { __table?: string }) => ({
      where: (condition: unknown) => {
        mockRoomDelete({ table: table?.__table, condition });
        return Promise.resolve({});
      },
    }),
    insert: (table: { __table?: string }) => ({
      values: (data: Record<string, unknown>) => ({
        returning: () => mockRoomInsert({ table: table?.__table, data }) as Promise<unknown[]>,
      }),
    }),
  },
}));

const authUser = (id: string): SupabaseUser => ({ id }) as SupabaseUser;

describe("rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoomsFindMany.mockResolvedValue([]);
    mockRoomInsert.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve([{ id: "room-1", ...data }]),
    );
  });

  describe("loadRoomConfigs", () => {
    it("should load room configs from a YAML file", async () => {
      mockReadTextFile.mockResolvedValue(
        JSON.stringify([
          { name: "Room 101", capacity: 2, members: ["a@example.com"] },
          { name: "Room 102", capacity: 3 },
        ]),
      );

      const result = await loadRoomConfigs("/assets/dev", "rooms/example-rooms.yaml");

      expect(mockJoinPath).toHaveBeenCalledWith("/assets/dev", "rooms/example-rooms.yaml");
      expect(mockReadTextFile).toHaveBeenCalledWith("/assets/dev/rooms/example-rooms.yaml");
      expect(result).toEqual([
        { name: "Room 101", capacity: 2, members: ["a@example.com"] },
        { name: "Room 102", capacity: 3 },
      ]);
    });

    it("should filter out entries with missing or invalid fields", async () => {
      mockReadTextFile.mockResolvedValue(
        JSON.stringify([
          { name: "Valid", capacity: 1 },
          null,
          "not-an-object",
          { capacity: 2 },
          { name: "No capacity" },
          { name: "Zero capacity", capacity: 0 },
          { name: "Negative capacity", capacity: -1 },
        ]),
      );

      const result = await loadRoomConfigs("/assets/dev", "rooms/mixed.yaml");

      expect(result).toEqual([{ name: "Valid", capacity: 1 }]);
    });

    it("should throw when the config is not an array", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify({ name: "Room 101", capacity: 2 }));

      await expect(loadRoomConfigs("/assets/dev", "rooms/object.yaml")).rejects.toThrow(
        "Rooms config must be an array: /assets/dev/rooms/object.yaml",
      );
    });
  });

  describe("seedRooms", () => {
    it("should detach occupants and drop existing rooms before seeding", async () => {
      mockRoomsFindMany.mockResolvedValue([{ id: "old-1" }, { id: "old-2" }]);

      await seedRooms([], "trip-1", new Map());

      expect(mockParticipantUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ table: "tripParticipants", data: { roomId: null } }),
      );
      expect(mockRoomDelete).toHaveBeenCalledWith(expect.objectContaining({ table: "rooms" }));
    });

    it("should not touch existing rooms when the trip has none", async () => {
      await seedRooms([{ name: "Room 101", capacity: 2 }], "trip-1", new Map());

      expect(mockRoomDelete).not.toHaveBeenCalled();
      expect(mockRoomInsert).toHaveBeenCalledWith({
        table: "rooms",
        data: { tripId: "trip-1", name: "Room 101", capacity: 2 },
      });
    });

    it("should assign known members to the created room", async () => {
      const authUsers: AuthUserByEmail = new Map([
        ["alice@example.com", authUser("auth-alice")],
        ["bob@example.com", authUser("auth-bob")],
      ]);
      mockUserFindFirst
        .mockResolvedValueOnce({ id: "user-alice" })
        .mockResolvedValueOnce({ id: "user-bob" });

      const configs: RoomConfig[] = [
        { name: "Room 101", capacity: 2, members: ["  Alice@example.com ", "bob@example.com"] },
      ];

      await seedRooms(configs, "trip-1", authUsers);

      expect(mockUserFindFirst).toHaveBeenCalledTimes(2);
      const assignments = mockParticipantUpdate.mock.calls.filter(
        (call) => (call[0] as { data: { roomId: string | null } }).data.roomId === "room-1",
      );
      expect(assignments).toHaveLength(2);
    });

    it("should skip members without an auth user or DB user", async () => {
      const authUsers: AuthUserByEmail = new Map([["known@example.com", authUser("auth-known")]]);
      mockUserFindFirst.mockResolvedValue(null);

      await seedRooms(
        [{ name: "Room 101", capacity: 3, members: ["unknown@example.com", "known@example.com"] }],
        "trip-1",
        authUsers,
      );

      // Only the known email reaches the DB lookup, and it resolves to no user.
      expect(mockUserFindFirst).toHaveBeenCalledTimes(1);
      expect(mockParticipantUpdate).not.toHaveBeenCalled();
    });

    it("should warn when members exceed capacity", async () => {
      const { logger } = await import("@mirai-app/common/utils");

      await seedRooms(
        [{ name: "Room 101", capacity: 1, members: ["a@example.com", "b@example.com"] }],
        "trip-1",
        new Map(),
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Room "Room 101" lists 2 members but capacity is 1'),
      );
    });

    it("should skip the room when insert returns nothing", async () => {
      mockRoomInsert.mockResolvedValue([]);

      await seedRooms(
        [{ name: "Room 101", capacity: 2, members: ["a@example.com"] }],
        "trip-1",
        new Map([["a@example.com", authUser("auth-a")]]),
      );

      expect(mockUserFindFirst).not.toHaveBeenCalled();
    });

    it("should keep seeding remaining rooms when one fails", async () => {
      const { logger } = await import("@mirai-app/common/utils");
      mockRoomInsert
        .mockRejectedValueOnce(new Error("insert failed"))
        .mockResolvedValueOnce([{ id: "room-2" }]);

      await seedRooms(
        [
          { name: "Broken", capacity: 2 },
          { name: "Room 102", capacity: 2 },
        ],
        "trip-1",
        new Map(),
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining("Failed to seed room Broken"),
      );
      expect(mockRoomInsert).toHaveBeenCalledTimes(2);
    });
  });
});
