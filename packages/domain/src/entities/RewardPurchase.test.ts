import { describe, it, expect } from "bun:test";
import { RewardPurchase, RewardPurchaseStatus } from "./RewardPurchase";

describe("[UNIT] RewardPurchase Entity", () => {
  describe("RewardPurchase.create", () => {
    it("should create with valid data", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 2,
        totalCost: 200,
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.rewardId).toBe("reward-123");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.quantity).toBe(2);
        expect(result.value.totalCost).toBe(200);
        expect(result.value.status).toBe(RewardPurchaseStatus.BOUGHT);
        expect(result.value.isPending()).toBe(true);
      }
    });

    it("should create with collection method", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        collectionMethod: "Pickup at hotel reception",
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.collectionMethod).toBe("Pickup at hotel reception");
        expect(result.value.hasCollectionMethod()).toBe(true);
      }
    });

    it("should reject empty rewardId", () => {
      const result = RewardPurchase.create({
        rewardId: "",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject quantity less than 1", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 0,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative total cost", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: -50,
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("RewardPurchase status transitions", () => {
    it("should transition from BOUGHT to ACCEPTED", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      const updated = purchaseResult.value.accept("admin-123");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe(RewardPurchaseStatus.ACCEPTED);
        expect(updated.value.statusUpdatedById).toBe("admin-123");
      }
    });

    it("should transition from ACCEPTED to IN_DELIVERY", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
        status: RewardPurchaseStatus.ACCEPTED,
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      const updated = purchaseResult.value.startDelivery("admin-123");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe(RewardPurchaseStatus.IN_DELIVERY);
      }
    });

    it("should transition from IN_DELIVERY to DELIVERED", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
        status: RewardPurchaseStatus.IN_DELIVERY,
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      const updated = purchaseResult.value.deliver("admin-123");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe(RewardPurchaseStatus.DELIVERED);
        expect(updated.value.isCompleted()).toBe(true);
        expect(updated.value.isTerminal()).toBe(true);
      }
    });

    it("should allow cancellation from BOUGHT", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      const updated = purchaseResult.value.cancel("admin-123");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe(RewardPurchaseStatus.CANCELLED);
        expect(updated.value.isCancelled()).toBe(true);
      }
    });

    it("should reject invalid status transition", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      // Cannot go from BOUGHT directly to DELIVERED
      const updated = purchaseResult.value.updateStatus(
        RewardPurchaseStatus.DELIVERED,
        "admin-123",
      );

      expect(updated.kind).toBe("err");
    });

    it("should reject transition without updater", () => {
      const purchaseResult = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      expect(purchaseResult.kind).toBe("ok");
      if (purchaseResult.kind !== "ok") return;

      const updated = purchaseResult.value.updateStatus(
        RewardPurchaseStatus.ACCEPTED,
        "",
      );

      expect(updated.kind).toBe("err");
    });
  });

  describe("RewardPurchase status checks", () => {
    it("should identify in progress", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
        status: RewardPurchaseStatus.ACCEPTED,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isInProgress()).toBe(true);
        expect(result.value.isPending()).toBe(false);
      }
    });

    it("should identify terminal state", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
        status: RewardPurchaseStatus.CANCELLED,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isTerminal()).toBe(true);
        expect(
          result.value.canTransitionTo(RewardPurchaseStatus.DELIVERED),
        ).toBe(false);
      }
    });
  });

  describe("RewardPurchase.getCostPerUnit", () => {
    it("should calculate cost per unit correctly", () => {
      const result = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 5,
        totalCost: 500,
        purchasedById: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCostPerUnit()).toBe(100);
      }
    });
  });
});
