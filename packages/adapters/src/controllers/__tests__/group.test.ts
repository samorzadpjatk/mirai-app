import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GroupController } from "../group";
import type { GroupRepository } from "@mirai-app/use-cases";
import { Group, GroupStatus } from "@mirai-app/domain";

// Mock Group domain object
const createMockGroup = (overrides?: Partial<Group>): Group =>
  ({
    id: "group-123",
    tripId: "trip-123",
    name: "Test Group",
    description: "Test description",
    image: null,
    organizerId: "user-123",
    code: "ABC123",
    coins: 100,
    status: GroupStatus.ACTIVE,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-02"),
    isActive: () => true,
    updateDetails: function (props: unknown) {
      return { kind: "ok", value: { ...this, ...props } };
    },
    addCoins: function (amount: number) {
      return { kind: "ok", value: { ...this, coins: this.coins + amount } };
    },
    markAsDeleted: function () {
      return { kind: "ok", value: { ...this, status: GroupStatus.DELETED } };
    },
    ...overrides,
  }) as unknown as Group;

describe("[UNIT] GroupController", () => {
  let controller: GroupController;
  let mockGroupRepository: GroupRepository;

  beforeEach(() => {
    mockGroupRepository = {
      findById: mock(() => Promise.resolve(createMockGroup())),
      findByCode: mock(() => Promise.resolve(createMockGroup())),
      findByTripId: mock(() => Promise.resolve([createMockGroup()])),
      create: mock((group: Group) => Promise.resolve(group)),
      update: mock((group: Group) => Promise.resolve(group)),
      findAll: mock(() => Promise.resolve([createMockGroup()])),
      findByOrganizerId: mock(() => Promise.resolve([createMockGroup()])),
    } as unknown as GroupRepository;

    controller = new GroupController(mockGroupRepository);
  });

  describe("getById", () => {
    it("should return group by ID", async () => {
      const result = await controller.getById({ id: "group-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("group-123");
        expect(result.data.name).toBe("Test Group");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should return error for invalid ID format", async () => {
      const result = await controller.getById({ id: "invalid" });

      expect(result.success).toBe(false);
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "group-123" });

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
  });

  describe("getByTripId", () => {
    it("should return groups for trip", async () => {
      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should return empty array when no groups", async () => {
      mockGroupRepository.findByTripId = mock(() => Promise.resolve([]));

      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("create", () => {
    it("should create group with valid input", async () => {
      mockGroupRepository.findByCode = mock(() => Promise.resolve(null));

      const input = {
        tripId: "trip-123",
        name: "New Group",
        organizerId: "user-123",
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
        Promise.resolve(createMockGroup()),
      );

      const input = {
        tripId: "trip-123",
        name: "New Group",
        organizerId: "user-123",
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
        organizerId: "user-123",
        code: "TEST123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update group with valid input", async () => {
      const input = {
        groupId: "group-123",
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
      }
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.update({ groupId: "group-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });

    it("should return error when updating deleted group", async () => {
      mockGroupRepository.findById = mock(() =>
        Promise.resolve(
          createMockGroup({
            status: GroupStatus.DELETED,
            isActive: () => false,
          }),
        ),
      );

      const result = await controller.update({
        groupId: "group-123",
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
        groupId: "group-123",
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
        groupId: "group-123",
        amount: 0,
      });

      expect(result.success).toBe(false);
    });

    it("should return error when group not found", async () => {
      mockGroupRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.addCoins({
        groupId: "group-123",
        amount: 50,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should soft delete group", async () => {
      const result = await controller.delete({ id: "group-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when group already deleted", async () => {
      mockGroupRepository.findById = mock(() =>
        Promise.resolve(
          createMockGroup({
            status: GroupStatus.DELETED,
            isActive: () => false,
          }),
        ),
      );

      const result = await controller.delete({ id: "group-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group is already deleted");
      }
    });
  });

  describe("getByOrganizer", () => {
    it("should return groups by organizer", async () => {
      const result = await controller.getByOrganizer({
        organizerId: "user-123",
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
});
