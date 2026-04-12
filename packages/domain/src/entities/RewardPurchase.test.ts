import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { RewardPurchase, RewardPurchaseStatus } from "./RewardPurchase";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] RewardPurchase Entity", () => {
  describe("RewardPurchase.create", () => {
    it("should create with valid data", () => {
      const effect = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 2,
        totalCost: 200,
        purchasedById: "user-789",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.rewardId).toBe("reward-123");
      expect(entity.groupId).toBe("group-456");
      expect(entity.quantity).toBe(2);
      expect(entity.totalCost).toBe(200);
      expect(entity.status).toBe(RewardPurchaseStatus.BOUGHT);
      expect(entity.isPending()).toBe(true);
    });

    it("should create with collection method", () => {
      const effect = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        collectionMethod: "Pickup at hotel reception",
        purchasedById: "user-789",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.collectionMethod).toBe("Pickup at hotel reception");
      expect(entity.hasCollectionMethod()).toBe(true);
    });

    it("should reject empty rewardId", () => {
      const effect = RewardPurchase.create({
        rewardId: "",
        groupId: "group-456",
        quantity: 1,
        totalCost: 100,
        purchasedById: "user-789",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("rewardId");
      }
    });

    it("should reject quantity less than 1", () => {
      const effect = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 0,
        totalCost: 100,
        purchasedById: "user-789",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("quantity");
      }
    });

    it("should reject negative total cost", () => {
      const effect = RewardPurchase.create({
        rewardId: "reward-123",
        groupId: "group-456",
        quantity: 1,
        totalCost: -50,
        purchasedById: "user-789",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("totalCost");
      }
    });
  });

  describe("RewardPurchase status transitions", () => {
    it("should transition from BOUGHT to ACCEPTED", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
        }),
      );

      const updated = Effect.runSync(purchase.accept("admin-123"));

      expect(updated.status).toBe(RewardPurchaseStatus.ACCEPTED);
      expect(updated.statusUpdatedById).toBe("admin-123");
    });

    it("should transition from ACCEPTED to IN_DELIVERY", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
          status: RewardPurchaseStatus.ACCEPTED,
        }),
      );

      const updated = Effect.runSync(purchase.startDelivery("admin-123"));

      expect(updated.status).toBe(RewardPurchaseStatus.IN_DELIVERY);
    });

    it("should transition from IN_DELIVERY to DELIVERED", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
          status: RewardPurchaseStatus.IN_DELIVERY,
        }),
      );

      const updated = Effect.runSync(purchase.deliver("admin-123"));

      expect(updated.status).toBe(RewardPurchaseStatus.DELIVERED);
      expect(updated.isCompleted()).toBe(true);
      expect(updated.isTerminal()).toBe(true);
    });

    it("should allow cancellation from BOUGHT", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
        }),
      );

      const updated = Effect.runSync(purchase.cancel("admin-123"));

      expect(updated.status).toBe(RewardPurchaseStatus.CANCELLED);
      expect(updated.isCancelled()).toBe(true);
    });

    it("should reject invalid status transition", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
        }),
      );

      // Cannot go from BOUGHT directly to DELIVERED
      const effect = purchase.updateStatus(
        RewardPurchaseStatus.DELIVERED,
        "admin-123",
      );

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(StateTransitionError);
        if (exit.cause.error instanceof StateTransitionError) {
          expect(exit.cause.error.from).toBe(RewardPurchaseStatus.BOUGHT);
          expect(exit.cause.error.to).toBe(RewardPurchaseStatus.DELIVERED);
        }
      }
    });

    it("should reject transition without updater", () => {
      const purchase = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
        }),
      );

      const effect = purchase.updateStatus(RewardPurchaseStatus.ACCEPTED, "");

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        if (exit.cause.error instanceof ValidationError) {
          expect(exit.cause.error.field).toBe("updatedById");
        }
      }
    });
  });

  describe("RewardPurchase status checks", () => {
    it("should identify in progress", () => {
      const entity = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
          status: RewardPurchaseStatus.ACCEPTED,
        }),
      );

      expect(entity.isInProgress()).toBe(true);
      expect(entity.isPending()).toBe(false);
    });

    it("should identify terminal state", () => {
      const entity = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 1,
          totalCost: 100,
          purchasedById: "user-789",
          status: RewardPurchaseStatus.CANCELLED,
        }),
      );

      expect(entity.isTerminal()).toBe(true);
      expect(entity.canTransitionTo(RewardPurchaseStatus.DELIVERED)).toBe(
        false,
      );
    });
  });

  describe("RewardPurchase.getCostPerUnit", () => {
    it("should calculate cost per unit correctly", () => {
      const entity = Effect.runSync(
        RewardPurchase.create({
          rewardId: "reward-123",
          groupId: "group-456",
          quantity: 5,
          totalCost: 500,
          purchasedById: "user-789",
        }),
      );

      expect(entity.getCostPerUnit()).toBe(100);
    });
  });
});
