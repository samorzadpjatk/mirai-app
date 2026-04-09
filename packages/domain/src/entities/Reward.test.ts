import { describe, it, expect } from "bun:test";
import {
  Reward,
  RewardPurchase,
  canTransitionPurchaseStatus,
  REWARD_PURCHASE_STATUSES,
} from "./Reward";
import { CoinAmount } from "../value-objects/CoinAmount";

// Helper to extract value from Result
const unwrap = <T, E>(
  result: { kind: "ok"; value: T } | { kind: "err"; error: E },
): T => {
  if (result.kind === "err") {
    throw new Error(`Unexpected error: ${result.error}`);
  }
  return result.value;
};

describe("[UNIT] Reward Entity", () => {
  describe("Reward.create", () => {
    it("should create reward with valid data", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Test Reward");
        expect(result.value.description).toBe("A test reward description");
        expect(result.value.availableQuantity).toBe(10);
        expect(result.value.coinCostPercentage.toNumber()).toBe(15);
        expect(result.value.isHidden).toBe(false);
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.createdById).toBe("user-123");
        expect(result.value.id).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty name", () => {
      const result = Reward.create({
        name: "",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Name");
      }
    });

    it("should reject name with only whitespace", () => {
      const result = Reward.create({
        name: "   ",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty description", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Description");
      }
    });

    it("should reject negative quantity", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: -1,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Quantity");
      }
    });

    it("should reject fractional quantity", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10.5,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject coin cost percentage below 1", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 0,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject coin cost percentage above 100", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 101,
        tripId: "trip-123",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty tripId", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "",
        createdById: "user-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should reject empty createdById", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("createdById");
      }
    });

    it("should create reward with images", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: ["image1.jpg", "image2.jpg"],
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.images).toEqual(["image1.jpg", "image2.jpg"]);
      }
    });

    it("should filter out empty image URLs", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: ["image1.jpg", "", "   ", "image2.jpg"],
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.images).toEqual(["image1.jpg", "image2.jpg"]);
      }
    });

    it("should reject too many images", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: Array(11).fill("image.jpg"),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("images");
      }
    });

    it("should create hidden reward when isHidden is true", () => {
      const result = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        isHidden: true,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isHidden).toBe(true);
      }
    });
  });

  describe("Reward.update", () => {
    it("should update name", () => {
      const reward = unwrap(
        Reward.create({
          name: "Original Name",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = reward.update({ name: "New Name" });
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.name).toBe("New Name");
        expect(updated.value.description).toBe("A test reward description"); // Unchanged
        expect(updated.value.id).toBe(reward.id); // Same ID
      }
    });

    it("should update description", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "Original description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = reward.update({ description: "New description" });
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.description).toBe("New description");
        expect(updated.value.name).toBe("Test Reward"); // Unchanged
      }
    });

    it("should update quantity", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = reward.update({ availableQuantity: 20 });
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.availableQuantity).toBe(20);
      }
    });

    it("should update images", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
          images: ["old.jpg"],
        }),
      );

      const updated = reward.update({ images: ["new1.jpg", "new2.jpg"] });
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.images).toEqual(["new1.jpg", "new2.jpg"]);
      }
    });

    it("should reject invalid name update", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = reward.update({ name: "" });
      expect(updated.kind).toBe("err");
    });

    it("should update multiple fields at once", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = reward.update({
        name: "New Name",
        availableQuantity: 5,
        coinCostPercentage: 25,
      });
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.name).toBe("New Name");
        expect(updated.value.availableQuantity).toBe(5);
        expect(updated.value.coinCostPercentage.toNumber()).toBe(25);
      }
    });
  });

  describe("Reward.hide / Reward.unhide", () => {
    it("should hide reward", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const hidden = reward.hide();
      expect(hidden.isHidden).toBe(true);
      expect(hidden.id).toBe(reward.id);
    });

    it("should unhide reward", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
          isHidden: true,
        }),
      );

      const unhidden = reward.unhide();
      expect(unhidden.isHidden).toBe(false);
    });
  });

  describe("Reward.decrementQuantity", () => {
    it("should decrease quantity", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const decremented = reward.decrementQuantity(3);
      expect(decremented.kind).toBe("ok");
      if (decremented.kind === "ok") {
        expect(decremented.value.availableQuantity).toBe(7);
      }
    });

    it("should reject decrementing more than available", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const decremented = reward.decrementQuantity(10);
      expect(decremented.kind).toBe("err");
      if (decremented.kind === "err") {
        expect(decremented.error).toContain("Not enough");
      }
    });

    it("should reject invalid decrement amount", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.decrementQuantity(0).kind).toBe("err");
      expect(reward.decrementQuantity(-1).kind).toBe("err");
      expect(reward.decrementQuantity(1.5).kind).toBe("err");
    });
  });

  describe("Reward.incrementQuantity", () => {
    it("should increase quantity", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const incremented = reward.incrementQuantity(5);
      expect(incremented.kind).toBe("ok");
      if (incremented.kind === "ok") {
        expect(incremented.value.availableQuantity).toBe(15);
      }
    });

    it("should reject invalid increment amount", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.incrementQuantity(0).kind).toBe("err");
      expect(reward.incrementQuantity(-1).kind).toBe("err");
      expect(reward.incrementQuantity(1.5).kind).toBe("err");
    });
  });

  describe("Reward.calculateDynamicCoinCost", () => {
    it("should calculate cost based on percentage of total points", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10, // 10%
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const cost = reward.calculateDynamicCoinCost(1000);
      expect(cost.toNumber()).toBe(100); // 10% of 1000
    });

    it("should round to nearest integer", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 33, // 33%
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const cost = reward.calculateDynamicCoinCost(100);
      expect(cost.toNumber()).toBe(33); // 33% of 100 = 33
    });

    it("should return minimum cost of 1 when total points is 0", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const cost = reward.calculateDynamicCoinCost(0);
      expect(cost.toNumber()).toBe(1);
    });

    it("should return minimum cost of 1 when calculation is less than 1", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 1, // 1%
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const cost = reward.calculateDynamicCoinCost(50);
      expect(cost.toNumber()).toBe(1); // 1% of 50 = 0.5, rounded up to 1
    });
  });

  describe("Reward.calculateTotalCost", () => {
    it("should calculate total cost for quantity", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10, // 10%
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const totalCost = reward.calculateTotalCost(3, 1000);
      expect(totalCost.toNumber()).toBe(300); // 3 * 10% of 1000
    });
  });

  describe("Reward.canAfford", () => {
    it("should return true when group has enough coins", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const groupCoins = CoinAmount.unsafeCreate(500);
      expect(reward.canAfford(groupCoins, 3, 1000)).toBe(true); // Need 300, have 500
    });

    it("should return false when group doesn't have enough coins", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const groupCoins = CoinAmount.unsafeCreate(200);
      expect(reward.canAfford(groupCoins, 3, 1000)).toBe(false); // Need 300, have 200
    });

    it("should return true when group has exactly enough coins", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const groupCoins = CoinAmount.unsafeCreate(300);
      expect(reward.canAfford(groupCoins, 3, 1000)).toBe(true); // Need 300, have 300
    });
  });

  describe("Reward.isInStock", () => {
    it("should return true when quantity > 0", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.isInStock()).toBe(true);
    });

    it("should return false when quantity = 0", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 0,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.isInStock()).toBe(false);
    });
  });

  describe("Reward.canBePurchased", () => {
    it("should return true when in stock and not hidden", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.canBePurchased()).toBe(true);
    });

    it("should return false when out of stock", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 0,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.canBePurchased()).toBe(false);
    });

    it("should return false when hidden", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
          isHidden: true,
        }),
      );

      expect(reward.canBePurchased()).toBe(false);
    });
  });

  describe("Reward.canPurchaseQuantity", () => {
    it("should return true when quantity is available", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.canPurchaseQuantity(5)).toBe(true);
    });

    it("should return false when quantity exceeds available", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.canPurchaseQuantity(10)).toBe(false);
    });
  });

  describe("Reward.getPrimaryImage", () => {
    it("should return first image", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
          images: ["image1.jpg", "image2.jpg"],
        }),
      );

      expect(reward.getPrimaryImage()).toBe("image1.jpg");
    });

    it("should return null when no images", () => {
      const reward = unwrap(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(reward.getPrimaryImage()).toBeNull();
    });
  });
});

describe("RewardPurchase Entity", () => {
  describe("RewardPurchase.create", () => {
    it("should create purchase with valid data", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        purchasedById: "user-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.rewardId).toBe("reward-123");
        expect(result.value.groupId).toBe("group-123");
        expect(result.value.quantity).toBe(2);
        expect(result.value.totalCost.toNumber()).toBe(100);
        expect(result.value.status).toBe("BOUGHT");
        expect(result.value.purchasedById).toBe("user-123");
      }
    });

    it("should create with custom status", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        purchasedById: "user-123",
        status: "ACCEPTED",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe("ACCEPTED");
      }
    });

    it("should reject invalid quantity", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 0,
        totalCost: 100,
        purchasedById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty groupId", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "",
        quantity: 2,
        totalCost: 100,
        purchasedById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty purchasedById", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        purchasedById: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject negative total cost", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 2,
        totalCost: -100,
        purchasedById: "user-123",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject invalid status", () => {
      const result = RewardPurchase.create({
        rewardId:
          "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
        groupId: "group-123",
        quantity: 2,
        totalCost: 100,
        purchasedById: "user-123",
        status: "INVALID" as RewardPurchaseStatus,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("RewardPurchase.updateStatus", () => {
    it("should update to valid next status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      const updated = purchase.updateStatus(
        "ACCEPTED",
        "admin-123",
        "Pick up at reception",
      );
      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe("ACCEPTED");
        expect(updated.value.collectionMethod).toBe("Pick up at reception");
      }
    });

    it("should reject invalid status transition", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      const updated = purchase.updateStatus("DELIVERED", "admin-123");
      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toContain("Cannot transition");
      }
    });

    it("should require collection method when accepting", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      const updated = purchase.updateStatus("ACCEPTED", "admin-123");
      expect(updated.kind).toBe("err");
      if (updated.kind === "err") {
        expect(updated.error).toContain("Collection method");
      }
    });

    it("should accept keeping existing collection method", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      // First accept with collection method
      const accepted = unwrap(
        purchase.updateStatus("ACCEPTED", "admin-123", "Pick up at reception"),
      );

      // Then transition to IN_DELIVERY - should keep the collection method
      const inDelivery = accepted.updateStatus("IN_DELIVERY", "admin-123");
      expect(inDelivery.kind).toBe("ok");
      if (inDelivery.kind === "ok") {
        expect(inDelivery.value.collectionMethod).toBe("Pick up at reception");
      }
    });
  });

  describe("RewardPurchase.canBeCancelled", () => {
    it("should return true for BOUGHT status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      expect(purchase.canBeCancelled()).toBe(true);
    });

    it("should return true for ACCEPTED status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "ACCEPTED",
        }),
      );

      expect(purchase.canBeCancelled()).toBe(true);
    });

    it("should return true for IN_DELIVERY status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "IN_DELIVERY",
        }),
      );

      expect(purchase.canBeCancelled()).toBe(true);
    });

    it("should return false for CANCELLED status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "CANCELLED",
        }),
      );

      expect(purchase.canBeCancelled()).toBe(false);
    });

    it("should return false for DELIVERED status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "DELIVERED",
        }),
      );

      expect(purchase.canBeCancelled()).toBe(false);
    });
  });

  describe("RewardPurchase.isFinal", () => {
    it("should return true for DELIVERED", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "DELIVERED",
        }),
      );

      expect(purchase.isFinal()).toBe(true);
    });

    it("should return true for CANCELLED", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "CANCELLED",
        }),
      );

      expect(purchase.isFinal()).toBe(true);
    });

    it("should return false for BOUGHT", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      expect(purchase.isFinal()).toBe(false);
    });
  });

  describe("RewardPurchase.isRefundable", () => {
    it("should return true for BOUGHT status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "BOUGHT",
        }),
      );

      expect(purchase.isRefundable()).toBe(true);
    });

    it("should return false for ACCEPTED status", () => {
      const purchase = unwrap(
        RewardPurchase.create({
          rewardId:
            "reward-123" as unknown as import("../value-objects/RewardId").RewardId,
          groupId: "group-123",
          quantity: 2,
          totalCost: 100,
          purchasedById: "user-123",
          status: "ACCEPTED",
        }),
      );

      expect(purchase.isRefundable()).toBe(false);
    });
  });
});

describe("canTransitionPurchaseStatus", () => {
  it("should allow transition from BOUGHT to ACCEPTED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "ACCEPTED")).toBe(true);
  });

  it("should allow transition from BOUGHT to CANCELLED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "CANCELLED")).toBe(true);
  });

  it("should allow transition from ACCEPTED to IN_DELIVERY", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "IN_DELIVERY")).toBe(true);
  });

  it("should allow transition from ACCEPTED to CANCELLED", () => {
    expect(canTransitionPurchaseStatus("ACCEPTED", "CANCELLED")).toBe(true);
  });

  it("should allow transition from IN_DELIVERY to DELIVERED", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "DELIVERED")).toBe(true);
  });

  it("should allow transition from IN_DELIVERY to CANCELLED", () => {
    expect(canTransitionPurchaseStatus("IN_DELIVERY", "CANCELLED")).toBe(true);
  });

  it("should NOT allow transition from BOUGHT to DELIVERED", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "DELIVERED")).toBe(false);
  });

  it("should NOT allow transition from CANCELLED to any status", () => {
    expect(canTransitionPurchaseStatus("CANCELLED", "BOUGHT")).toBe(false);
    expect(canTransitionPurchaseStatus("CANCELLED", "ACCEPTED")).toBe(false);
    expect(canTransitionPurchaseStatus("CANCELLED", "DELIVERED")).toBe(false);
  });

  it("should NOT allow transition from DELIVERED to any status", () => {
    expect(canTransitionPurchaseStatus("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransitionPurchaseStatus("DELIVERED", "BOUGHT")).toBe(false);
  });

  it("should allow same status transition", () => {
    expect(canTransitionPurchaseStatus("BOUGHT", "BOUGHT")).toBe(true);
    expect(canTransitionPurchaseStatus("DELIVERED", "DELIVERED")).toBe(true);
  });
});
