import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryGroupGateway } from "./gateway";
import type { GroupDTO } from "@mirai-app/use-cases";
import { GroupStatus, GroupId } from "@mirai-app/domain";

describe("[UNIT] InMemoryGroupGateway", () => {
  let gateway: InMemoryGroupGateway;

  const createGroupId = (id: string) => GroupId.unsafeCreate(id);

  const createMockGroup = (
    id: string,
    createdAt: Date,
    overrides: Partial<GroupDTO> = {},
  ): GroupDTO => ({
    id,
    tripId: overrides.tripId ?? "trip-001",
    name: overrides.name ?? `Group ${id}`,
    code: overrides.code ?? `CODE-${id}`,
    description: null,
    imageUrl: null,
    status: overrides.status ?? GroupStatus.ACTIVE,
    coins: overrides.coins ?? 100,
    maxMembers: null,
    createdById: overrides.createdById ?? "organizer-001",
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    deletedById: null,
  });

  beforeEach(() => {
    gateway = new InMemoryGroupGateway();
  });

  describe("CRUD Operations", () => {
    it("creates a group", async () => {
      const group = createMockGroup("group-001", new Date());

      const result = await Effect.runPromise(gateway.create(group));

      expect(result.id).toBe("group-001");
      expect(result.name).toBe("Group group-001");
    });

    it("finds group by id", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      const result = await Effect.runPromise(
        gateway.findById(createGroupId("group-001")),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("group-001");
    });

    it("returns null when group not found", async () => {
      const result = await Effect.runPromise(
        gateway.findById(createGroupId("nonexistent")),
      );

      expect(result).toBeNull();
    });

    it("updates a group", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      const updated: GroupDTO = { ...group, name: "Updated Group Name" };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.name).toBe("Updated Group Name");

      const found = await Effect.runPromise(
        gateway.findById(createGroupId("group-001")),
      );
      expect(found?.name).toBe("Updated Group Name");
    });

    it("deletes a group", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      await Effect.runPromise(gateway.delete(createGroupId("group-001")));

      const result = await Effect.runPromise(
        gateway.findById(createGroupId("group-001")),
      );
      expect(result).toBeNull();
    });

    it("checks if group exists", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      const exists = await Effect.runPromise(
        gateway.exists(createGroupId("group-001")),
      );
      const notExists = await Effect.runPromise(
        gateway.exists(createGroupId("nonexistent")),
      );

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("Code Operations", () => {
    it("finds group by code", async () => {
      const group = createMockGroup("group-001", new Date(), {
        code: "SPECIAL",
      });
      await Effect.runPromise(gateway.create(group));

      const result = await Effect.runPromise(gateway.findByCode("SPECIAL"));

      expect(result).not.toBeNull();
      expect(result?.code).toBe("SPECIAL");
    });

    it("returns null when code not found", async () => {
      const result = await Effect.runPromise(gateway.findByCode("NONEXISTENT"));
      expect(result).toBeNull();
    });

    it("checks if code exists", async () => {
      const group = createMockGroup("group-001", new Date(), {
        code: "UNIQUE",
      });
      await Effect.runPromise(gateway.create(group));

      const exists = await Effect.runPromise(gateway.existsByCode("UNIQUE"));
      const notExists = await Effect.runPromise(gateway.existsByCode("OTHER"));

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it("excludes group when checking code existence", async () => {
      const group = createMockGroup("group-001", new Date(), {
        code: "SHAREDCODE",
      });
      await Effect.runPromise(gateway.create(group));

      const exists = await Effect.runPromise(
        gateway.existsByCode("SHAREDCODE", createGroupId("group-001")),
      );

      expect(exists).toBe(false);
    });
  });

  describe("Query Operations", () => {
    it("finds groups by trip id", async () => {
      const trip1Groups = [
        createMockGroup("group-001", new Date(), { tripId: "trip-1" }),
        createMockGroup("group-002", new Date(), { tripId: "trip-1" }),
      ];
      const trip2Group = createMockGroup("group-003", new Date(), {
        tripId: "trip-2",
      });

      await Effect.runPromise(gateway.seed([...trip1Groups, trip2Group]));

      const result = await Effect.runPromise(gateway.findByTripId("trip-1"));

      expect(result).toHaveLength(2);
      expect(result.every((g) => g.tripId === "trip-1")).toBe(true);
    });

    it("finds groups by status", async () => {
      const groups = [
        createMockGroup("group-001", new Date(), {
          status: GroupStatus.ACTIVE,
        }),
        createMockGroup("group-002", new Date(), {
          status: GroupStatus.ACTIVE,
        }),
        createMockGroup("group-003", new Date(), {
          status: GroupStatus.DELETED,
        }),
      ];
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByStatus(GroupStatus.ACTIVE),
      );

      expect(result).toHaveLength(2);
      expect(result.every((g) => g.status === GroupStatus.ACTIVE)).toBe(true);
    });

    it("returns all groups with pagination", async () => {
      const groups = Array.from({ length: 25 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 10, offset: 5 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
      expect(result.hasMore).toBe(true);
    });

    it("finds groups by trip id and status", async () => {
      const groups = [
        createMockGroup("group-001", new Date(), {
          tripId: "trip-1",
          status: GroupStatus.ACTIVE,
        }),
        createMockGroup("group-002", new Date(), {
          tripId: "trip-1",
          status: GroupStatus.DELETED,
        }),
        createMockGroup("group-003", new Date(), {
          tripId: "trip-2",
          status: GroupStatus.ACTIVE,
        }),
      ];
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatus("trip-1", GroupStatus.ACTIVE),
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("group-001");
    });

    it("finds groups by organizer id", async () => {
      const groups = [
        createMockGroup("group-001", new Date(), { createdById: "org-1" }),
        createMockGroup("group-002", new Date(), { createdById: "org-1" }),
        createMockGroup("group-003", new Date(), { createdById: "org-2" }),
      ];
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByOrganizerId("org-1"),
      );

      expect(result).toHaveLength(2);
      expect(result.every((g) => g.createdById === "org-1")).toBe(true);
    });
  });

  describe("Coin Operations", () => {
    it("gets group coins", async () => {
      const group = createMockGroup("group-001", new Date(), { coins: 500 });
      await Effect.runPromise(gateway.create(group));

      const result = await Effect.runPromise(
        gateway.getCoins(createGroupId("group-001")),
      );

      expect(result).toBe(500);
    });

    it("returns 0 for non-existent group coins", async () => {
      const result = await Effect.runPromise(
        gateway.getCoins(createGroupId("nonexistent")),
      );
      expect(result).toBe(0);
    });

    it("updates group coins", async () => {
      const group = createMockGroup("group-001", new Date(), { coins: 100 });
      await Effect.runPromise(gateway.create(group));

      const result = await Effect.runPromise(
        gateway.updateCoins(createGroupId("group-001"), 50),
      );

      expect(result.coins).toBe(150);

      const coins = await Effect.runPromise(
        gateway.getCoins(createGroupId("group-001")),
      );
      expect(coins).toBe(150);
    });

    it("subtracts coins when amount is negative", async () => {
      const group = createMockGroup("group-001", new Date(), { coins: 100 });
      await Effect.runPromise(gateway.create(group));

      await Effect.runPromise(
        gateway.updateCoins(createGroupId("group-001"), -30),
      );

      const coins = await Effect.runPromise(
        gateway.getCoins(createGroupId("group-001")),
      );
      expect(coins).toBe(70);
    });

    it("fails when updating coins for non-existent group", async () => {
      const result = await Effect.runPromise(
        Effect.either(gateway.updateCoins(createGroupId("nonexistent"), 50)),
      );

      expect(result._tag).toBe("Left");
    });
  });

  describe("Participant Management", () => {
    const createParticipant = (
      id: string,
      userId: string,
      tripId: string,
      groupId: string | null,
      role = "MEMBER",
    ) => ({
      id,
      userId,
      tripId,
      groupId,
      role,
      joinedAt: new Date(),
    });

    it("finds participant by user id and trip id", async () => {
      const participant = createParticipant(
        "part-001",
        "user-001",
        "trip-001",
        "group-001",
      );
      await Effect.runPromise(gateway.seedParticipants([participant]));

      const result = await Effect.runPromise(
        gateway.findParticipantByUserIdAndTripId("user-001", "trip-001"),
      );

      expect(result).not.toBeNull();
      expect(result?.userId).toBe("user-001");
      expect(result?.tripId).toBe("trip-001");
    });

    it("returns null when participant not found", async () => {
      const result = await Effect.runPromise(
        gateway.findParticipantByUserIdAndTripId("user-001", "trip-001"),
      );
      expect(result).toBeNull();
    });

    it("finds participants by group id", async () => {
      const participants = [
        createParticipant("part-001", "user-001", "trip-001", "group-001"),
        createParticipant("part-002", "user-002", "trip-001", "group-001"),
        createParticipant("part-003", "user-003", "trip-001", "group-002"),
      ];
      await Effect.runPromise(gateway.seedParticipants(participants));

      const result = await Effect.runPromise(
        gateway.findParticipantsByGroupId("group-001"),
      );

      expect(result).toHaveLength(2);
    });

    it("assigns user to group", async () => {
      const group = createMockGroup("group-001", new Date(), {
        tripId: "trip-001",
      });
      await Effect.runPromise(gateway.create(group));

      const participant = createParticipant(
        "part-001",
        "user-001",
        "trip-001",
        null,
      );
      await Effect.runPromise(gateway.seedParticipants([participant]));

      const result = await Effect.runPromise(
        gateway.assignUserToGroup("user-001", "group-001"),
      );

      expect(result.groupId).toBe("group-001");
    });

    it("fails to assign user to non-existent group", async () => {
      const participant = createParticipant(
        "part-001",
        "user-001",
        "trip-001",
        null,
      );
      await Effect.runPromise(gateway.seedParticipants([participant]));

      const result = await Effect.runPromise(
        Effect.either(gateway.assignUserToGroup("user-001", "nonexistent")),
      );

      expect(result._tag).toBe("Left");
    });

    it("fails to assign non-existent user to group", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      const result = await Effect.runPromise(
        Effect.either(gateway.assignUserToGroup("nonexistent", "group-001")),
      );

      expect(result._tag).toBe("Left");
    });

    it("removes user from group", async () => {
      const group = createMockGroup("group-001", new Date(), {
        tripId: "trip-001",
      });
      await Effect.runPromise(gateway.create(group));

      const participant = createParticipant(
        "part-001",
        "user-001",
        "trip-001",
        "group-001",
      );
      await Effect.runPromise(gateway.seedParticipants([participant]));

      const result = await Effect.runPromise(
        gateway.removeUserFromGroup("user-001", "group-001"),
      );

      expect(result.groupId).toBeNull();
    });

    it("fails to remove user not in group", async () => {
      const group = createMockGroup("group-001", new Date(), {
        tripId: "trip-001",
      });
      await Effect.runPromise(gateway.create(group));

      const participant = createParticipant(
        "part-001",
        "user-001",
        "trip-001",
        "group-002",
      );
      await Effect.runPromise(gateway.seedParticipants([participant]));

      const result = await Effect.runPromise(
        Effect.either(gateway.removeUserFromGroup("user-001", "group-001")),
      );

      expect(result._tag).toBe("Left");
    });
  });

  describe("Cursor Pagination", () => {
    it("finds by trip id with cursor pagination", async () => {
      const groups = Array.from({ length: 25 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          { tripId: "trip-001" },
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { limit: 10 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).not.toBeNull();
    });

    it("finds by status with cursor pagination", async () => {
      const groups = Array.from({ length: 15 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            status: GroupStatus.ACTIVE,
          },
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByStatusConnection(GroupStatus.ACTIVE, { limit: 10 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it("finds by trip id and status with cursor pagination", async () => {
      const groups = Array.from({ length: 20 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            tripId: "trip-001",
            status: GroupStatus.ACTIVE,
          },
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByTripIdAndStatusConnection(
          "trip-001",
          GroupStatus.ACTIVE,
          { limit: 10 },
        ),
      );

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it("finds by organizer id with cursor pagination", async () => {
      const groups = Array.from({ length: 15 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            createdById: "org-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const result = await Effect.runPromise(
        gateway.findByOrganizerIdConnection("org-001", { limit: 10 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
    });

    it("uses cursor for pagination", async () => {
      const groups = Array.from({ length: 25 }, (_, i) =>
        createMockGroup(
          `group-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
          {
            tripId: "trip-001",
          },
        ),
      );
      await Effect.runPromise(gateway.seed(groups));

      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { limit: 10 }),
      );

      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", {
          limit: 10,
          cursor: firstPage.nextCursor,
        }),
      );

      expect(secondPage.items).toHaveLength(10);
      expect(secondPage.hasMore).toBe(true);
    });
  });

  describe("Reset and State Management", () => {
    it("resets gateway state", async () => {
      const group = createMockGroup("group-001", new Date());
      await Effect.runPromise(gateway.create(group));

      const participant = {
        id: "part-001",
        userId: "user-001",
        tripId: "trip-001",
        groupId: "group-001",
        role: "MEMBER",
        joinedAt: new Date(),
      };
      await Effect.runPromise(gateway.seedParticipants([participant]));

      await Effect.runPromise(gateway.reset());

      const foundGroup = await Effect.runPromise(
        gateway.findById(createGroupId("group-001")),
      );
      const foundParticipant = await Effect.runPromise(
        gateway.findParticipantByUserIdAndTripId("user-001", "trip-001"),
      );

      expect(foundGroup).toBeNull();
      expect(foundParticipant).toBeNull();
    });

    it("counts by trip id", async () => {
      const groups = [
        createMockGroup("group-001", new Date(), { tripId: "trip-001" }),
        createMockGroup("group-002", new Date(), { tripId: "trip-001" }),
        createMockGroup("group-003", new Date(), { tripId: "trip-002" }),
      ];
      await Effect.runPromise(gateway.seed(groups));

      const count = await Effect.runPromise(gateway.countByTripId("trip-001"));

      expect(count).toBe(2);
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the InMemoryGroupGateway implementation with:
 *
 * - CRUD Operations: create, findById, update, delete, exists
 * - Code Operations: findByCode, existsByCode with exclude support
 * - Query Operations: findByTripId, findByStatus, findAll, findByTripIdAndStatus, findByOrganizerId
 * - Coin Operations: getCoins, updateCoins with positive/negative amounts, error handling
 * - Participant Management: findParticipantByUserIdAndTripId, findParticipantsByGroupId,
 *   assignUserToGroup, removeUserFromGroup with proper error cases
 * - Cursor Pagination: All connection methods with cursor support
 * - Reset and State Management: reset clears both groups and participants, countByTripId
 *
 * Total test cases: 35+
 * All tests use beforeEach to ensure clean state between runs.
 */
