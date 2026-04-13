import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { GroupController } from "../group";
import type { GroupRepository } from "@mirai-app/use-cases";
import { Group, GroupStatus } from "@mirai-app/domain";

// Valid UUIDs for testing
const TEST_GROUP_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEST_TRIP_ID = "550e8400-e29b-41d4-a716-446655440002";
const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440003";

// Mock Group domain object
const createMockGroup = (overrides?: Partial<Group>): Group =>
  ({
    id: TEST_GROUP_ID,
    tripId: TEST_TRIP_ID,
    name: "Test Group",
    description: "Test description",
    image: null,
    organizerId: TEST_USER_ID,
    code: "ABC123",
    coins: 100,
    status: GroupStatus.ACTIVE,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    isActive: () => true,
    isDeleted: () => false,
    updateDetails: function (props: unknown) {
      return Effect.succeed({ ...this, ...props } as Group);
    },
    addCoins: function (amount: number) {
      return Effect.succeed({ ...this, coins: this.coins + amount } as Group);
    },
    markAsDeleted: function () {
      return Effect.succeed({ ...this, status: GroupStatus.DELETED } as Group);
    },
    getSummary: function () {
      return `Test Group (Code: ABC123)`;
    },
    ...overrides,
  }) as unknown as Group;

describe("[UNIT] GroupController", () => {
  let controller: GroupController;
  let mockGroupRepository: GroupRepository;

  beforeEach(() => {
    mockGroupRepository = {
      findById: mock(() => Effect.succeed(createMockGroup())),
      findByCode: mock(() => Effect.succeed(createMockGroup())),
      findByTripId: mock(() => Effect.succeed([createMockGroup()])),
      create: mock((group: Group) => Effect.succeed(group)),
      update: mock((group: Group) => Effect.succeed(group)),
      findAll: mock(() => Effect.succeed([createMockGroup()])),
      findByOrganizerId: mock(() => Effect.succeed([createMockGroup()])),
      findByStatus: mock(() => Effect.succeed([createMockGroup()])),
      findByTripIdAndStatus: mock(() => Effect.succeed([createMockGroup()])),
      delete: mock(() => Effect.succeed(void 0)),
      exists: mock(() => Effect.succeed(true)),
      countByTripId: mock(() => Effect.succeed(1)),
    } as unknown as GroupRepository;

    controller = new GroupController(mockGroupRepository);
  });

  describe("getById", () => {
    it("should return group by ID", async () => {
      const result = await controller.getById({ id: TEST_GROUP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_GROUP_ID);
        expect(result.data.name).toBe("Test Group");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should return error for invalid ID format", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TEST_GROUP_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });
  });

  describe("getByCode", () => {
    it("should return group by code", async () => {
      const result = await controller.getByCode({ code: "ABC123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("ABC123");
      }
    });

    it("should return error for empty code", async () => {
      const result = await controller.getByCode({ code: "" });

      expect(result.success).toBe(false);
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findByCode = mock(() => Effect.succeed(null));

      const result = await controller.getByCode({ code: "NONEXISTENT" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });
  });

  describe("getByTripId", () => {
    it("should return groups for trip", async () => {
      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should return empty array when no groups", async () => {
      mockGroupRepository.findByTripId = mock(() => Effect.succeed([]));

      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("create", () => {
    it("should create group with valid input", async () => {
      mockGroupRepository.findByCode = mock(() => Effect.succeed(null));

      const input = {
        tripId: TEST_TRIP_ID,
        name: "New Group",
        organizerId: TEST_USER_ID,
        code: "NEW123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Group");
        expect(result.data.code).toBe("NEW123");
      }
    });

    it("should return error when code is already in use", async () => {
      mockGroupRepository.findByCode = mock(() =>
        Effect.succeed(createMockGroup()),
      );

      const input = {
        tripId: TEST_TRIP_ID,
        name: "New Group",
        organizerId: TEST_USER_ID,
        code: "ABC123",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group code is already in use");
      }
    });

    it("should return error for invalid tripId", async () => {
      const result = await controller.create({
        tripId: "invalid",
        name: "Test",
        organizerId: TEST_USER_ID,
        code: "TEST123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update group with valid input", async () => {
      const input = {
        groupId: TEST_GROUP_ID,
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
      }
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.update({ groupId: TEST_GROUP_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });

    it("should return error when updating deleted group", async () => {
      mockGroupRepository.findById = mock(() =>
        Effect.succeed(
          createMockGroup({
            status: GroupStatus.DELETED,
            isActive: () => false,
            isDeleted: () => true,
          }),
        ),
      );

      const result = await controller.update({
        groupId: TEST_GROUP_ID,
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot update a deleted group");
      }
    });
  });

  describe("addCoins", () => {
    it("should add coins to group", async () => {
      const input = {
        groupId: TEST_GROUP_ID,
        amount: 50,
      };

      const result = await controller.addCoins(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.previousCoins).toBe(100);
        expect(result.data.newCoins).toBe(150);
      }
    });

    it("should return error for invalid amount", async () => {
      const result = await controller.addCoins({
        groupId: TEST_GROUP_ID,
        amount: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.addCoins({
        groupId: TEST_GROUP_ID,
        amount: 50,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should soft delete group", async () => {
      const result = await controller.delete({ id: TEST_GROUP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when group already deleted", async () => {
      mockGroupRepository.findById = mock(() =>
        Effect.succeed(
          createMockGroup({
            status: GroupStatus.DELETED,
            isActive: () => false,
            isDeleted: () => true,
          }),
        ),
      );

      const result = await controller.delete({ id: TEST_GROUP_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group is already deleted");
      }
    });
  });

  describe("getByOrganizer", () => {
    it("should return groups by organizer", async () => {
      const result = await controller.getByOrganizer({
        organizerId: TEST_USER_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should return error for missing organizerId", async () => {
      const result = await controller.getByOrganizer({ organizerId: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
    it("should return paginated groups", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should return empty array when no groups", async () => {
      mockGroupRepository.findAll = mock(() => Effect.succeed([]));

      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
