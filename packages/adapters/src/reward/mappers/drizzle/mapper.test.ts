import { describe, it, expect } from "bun:test";
import { RewardDrizzleMapper, RewardPurchaseDrizzleMapper } from "./mapper";
import { RewardStatus, RewardPurchaseStatus } from "@mirai-app/domain";
import type {
  RewardSelect,
  RewardPurchaseSelect,
} from "@mirai-app/frameworks/drizzle";

describe("[UNIT] RewardDrizzleMapper", () => {
  const mapper = RewardDrizzleMapper.instance;

  // Factory for creating mock Drizzle Reward records
  const createMockRewardSelect = (
    overrides: Partial<RewardSelect> & Record<string, unknown> = {},
  ): RewardSelect => ({
    id: "reward-123",
    tripId: "trip-456",
    name: "Test Reward",
    description: "A test reward description",
    image: "https://example.com/reward.png",
    availableQuantity: 10,
    isHidden: false,
    coinCost: 100,
    createdById: "admin-001",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to RewardDTO", () => {
      const record = createMockRewardSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("reward-123");
      expect(dto.tripId).toBe("trip-456");
      expect(dto.title).toBe("Test Reward");
      expect(dto.description).toBe("A test reward description");
      expect(dto.imageUrl).toBe("https://example.com/reward.png");
      expect(dto.pointsCost).toBe(0);
      expect(dto.quantity).toBe(10);
      expect(dto.availableQuantity).toBe(10);
      expect(dto.status).toBe(RewardStatus.AVAILABLE);
      expect(dto.isHidden).toBe(false);
      expect(dto.createdById).toBe("admin-001");
      expect(dto.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null image", () => {
      const record = createMockRewardSelect({
        image: null,
      });

      const dto = mapper.toDTO(record);

      expect(dto.imageUrl).toBeNull();
    });

    it("handles null description", () => {
      const record = createMockRewardSelect({
        description: null as unknown as string,
      });

      const dto = mapper.toDTO(record);

      expect(dto.description).toBeNull();
    });

    it("handles hidden reward", () => {
      const record = createMockRewardSelect({
        isHidden: true,
      });

      const dto = mapper.toDTO(record);

      expect(dto.isHidden).toBe(true);
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts RewardDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockRewardSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("reward-123");
      expect(insert.tripId).toBe("trip-456");
      expect(insert.name).toBe("Test Reward");
      expect(insert.description).toBe("A test reward description");
      expect(insert.image).toBe("https://example.com/reward.png");
      expect(insert.availableQuantity).toBe(10);
      expect(insert.isHidden).toBe(false);
      expect(insert.createdById).toBe("admin-001");
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles null image in insert", () => {
      const record = createMockRewardSelect({
        image: null,
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.image).toBeNull();
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts RewardDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockRewardSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id, tripId, createdById, createdAt
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("tripId");
      expect(update).not.toHaveProperty("createdById");
      expect(update).not.toHaveProperty("createdAt");

      // Should include updatable fields
      expect(update.name).toBe("Test Reward");
      expect(update.description).toBe("A test reward description");
      expect(update.image).toBe("https://example.com/reward.png");
      expect(update.availableQuantity).toBe(10);
      expect(update.isHidden).toBe(false);
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockRewardSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = RewardDrizzleMapper.instance;
      const instance2 = RewardDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});

describe("[UNIT] RewardPurchaseDrizzleMapper", () => {
  const mapper = RewardPurchaseDrizzleMapper.instance;

  // Factory for creating mock Drizzle RewardPurchase records
  const createMockRewardPurchaseSelect = (
    overrides: Partial<RewardPurchaseSelect> & Record<string, unknown> = {},
  ): RewardPurchaseSelect => ({
    id: "purchase-123",
    rewardId: "reward-456",
    groupId: "group-789",
    quantity: 2,
    totalCost: 200,
    status: "BOUGHT",
    collectionMethod: "PICKUP",
    purchasedById: "user-001",
    statusUpdatedById: null,
    statusUpdatedAt: null,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ...overrides,
  });

  describe("toDTO", () => {
    it("converts Drizzle record to RewardPurchaseDTO", () => {
      const record = createMockRewardPurchaseSelect();

      const dto = mapper.toDTO(record);

      expect(dto.id).toBe("purchase-123");
      expect(dto.rewardId).toBe("reward-456");
      expect(dto.groupId).toBe("group-789");
      expect(dto.userId).toBe("user-001");
      expect(dto.pointsSpent).toBe(200);
      expect(dto.status).toBe(RewardPurchaseStatus.BOUGHT);
      expect(dto.quantity).toBe(2);
      expect(dto.collectionMethod).toBe("PICKUP");
      expect(dto.collectedAt).toBeNull();
      expect(dto.collectedById).toBeNull();
      expect(dto.notes).toBeNull();
      expect(dto.purchasedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(dto.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("maps status correctly from Drizzle", () => {
      const boughtRecord = createMockRewardPurchaseSelect({ status: "BOUGHT" });
      const acceptedRecord = createMockRewardPurchaseSelect({
        status: "ACCEPTED",
      });
      const inDeliveryRecord = createMockRewardPurchaseSelect({
        status: "IN_DELIVERY",
      });
      const cancelledRecord = createMockRewardPurchaseSelect({
        status: "CANCELLED",
      });
      const deliveredRecord = createMockRewardPurchaseSelect({
        status: "DELIVERED",
      });

      expect(mapper.toDTO(boughtRecord).status).toBe(
        RewardPurchaseStatus.BOUGHT,
      );
      expect(mapper.toDTO(acceptedRecord).status).toBe(
        RewardPurchaseStatus.ACCEPTED,
      );
      expect(mapper.toDTO(inDeliveryRecord).status).toBe(
        RewardPurchaseStatus.IN_DELIVERY,
      );
      expect(mapper.toDTO(cancelledRecord).status).toBe(
        RewardPurchaseStatus.CANCELLED,
      );
      expect(mapper.toDTO(deliveredRecord).status).toBe(
        RewardPurchaseStatus.DELIVERED,
      );
    });

    it("defaults unknown status to BOUGHT", () => {
      const record = createMockRewardPurchaseSelect({
        status: "UNKNOWN" as unknown as RewardPurchaseSelect["status"],
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe(RewardPurchaseStatus.BOUGHT);
    });

    it("handles delivered status with delivery info", () => {
      const record = createMockRewardPurchaseSelect({
        status: "DELIVERED",
        statusUpdatedById: "admin-001",
        statusUpdatedAt: new Date("2024-01-16T12:00:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.status).toBe(RewardPurchaseStatus.DELIVERED);
      expect(dto.collectedById).toBe("admin-001");
      expect(dto.collectedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });

    it("uses createdAt as purchasedAt when createdAt is available", () => {
      const record = createMockRewardPurchaseSelect({
        createdAt: new Date("2024-01-14T08:00:00Z"),
      });

      const dto = mapper.toDTO(record);

      expect(dto.purchasedAt).toEqual(new Date("2024-01-14T08:00:00Z"));
    });
  });

  describe("toDrizzleInsert", () => {
    it("converts RewardPurchaseDTO to Drizzle insert input", () => {
      const dto = mapper.toDTO(createMockRewardPurchaseSelect());

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.id).toBe("purchase-123");
      expect(insert.rewardId).toBe("reward-456");
      expect(insert.groupId).toBe("group-789");
      expect(insert.quantity).toBe(2);
      expect(insert.totalCost).toBe(200);
      expect(insert.status).toBe("BOUGHT");
      expect(insert.collectionMethod).toBe("PICKUP");
      expect(insert.purchasedById).toBe("user-001");
      expect(insert.statusUpdatedById).toBeNull();
      expect(insert.statusUpdatedAt).toBeNull();
      expect(insert.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
      expect(insert.updatedAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    it("handles delivered status in insert", () => {
      const record = createMockRewardPurchaseSelect({
        status: "DELIVERED",
        statusUpdatedById: "admin-001",
        statusUpdatedAt: new Date("2024-01-16T12:00:00Z"),
      });
      const dto = mapper.toDTO(record);

      const insert = mapper.toDrizzleInsert(dto);

      expect(insert.status).toBe("DELIVERED");
      expect(insert.statusUpdatedById).toBe("admin-001");
      expect(insert.statusUpdatedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });
  });

  describe("toDrizzleUpdate", () => {
    it("converts RewardPurchaseDTO to Drizzle update input", () => {
      const dto = mapper.toDTO(createMockRewardPurchaseSelect());

      const update = mapper.toDrizzleUpdate(dto);

      // Should not include id, rewardId, groupId, quantity, totalCost, createdAt, purchasedById
      expect(update).not.toHaveProperty("id");
      expect(update).not.toHaveProperty("rewardId");
      expect(update).not.toHaveProperty("groupId");
      expect(update).not.toHaveProperty("quantity");
      expect(update).not.toHaveProperty("totalCost");
      expect(update).not.toHaveProperty("createdAt");
      expect(update).not.toHaveProperty("purchasedById");

      // Should include updatable fields
      expect(update.status).toBe("BOUGHT");
      expect(update.collectionMethod).toBe("PICKUP");
      expect(update.statusUpdatedById).toBeNull();
      expect(update.statusUpdatedAt).toBeNull();
    });

    it("updates updatedAt to current time", () => {
      const dto = mapper.toDTO(createMockRewardPurchaseSelect());
      const beforeUpdate = new Date();

      const update = mapper.toDrizzleUpdate(dto);

      const afterUpdate = new Date();
      expect(update.updatedAt).toBeInstanceOf(Date);
      expect(update.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(update.updatedAt!.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("handles status update with delivery info", () => {
      const record = createMockRewardPurchaseSelect({
        status: "DELIVERED",
        statusUpdatedById: "admin-001",
        statusUpdatedAt: new Date("2024-01-16T12:00:00Z"),
      });
      const dto = mapper.toDTO(record);

      const update = mapper.toDrizzleUpdate(dto);

      expect(update.status).toBe("DELIVERED");
      expect(update.statusUpdatedById).toBe("admin-001");
      expect(update.statusUpdatedAt).toEqual(new Date("2024-01-16T12:00:00Z"));
    });
  });

  describe("singleton instance", () => {
    it("returns the same instance", () => {
      const instance1 = RewardPurchaseDrizzleMapper.instance;
      const instance2 = RewardPurchaseDrizzleMapper.instance;

      expect(instance1).toBe(instance2);
    });
  });
});
