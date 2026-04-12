import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Reward, REWARD_PURCHASE_STATUSES } from "./Reward";
import {
  RewardPurchase,
  RewardPurchaseStatus,
  canTransitionPurchaseStatus,
} from "./RewardPurchase";
import { CoinAmount } from "../value-objects/CoinAmount";
import { ValidationError } from "../errors/effect-errors";

// Helper to unwrap Effect and return entity (throws on error)
const unwrapEffect = <T>(
  effect: Effect.Effect<T, ValidationError, never>,
): T => {
  return Effect.runSync(effect);
};

describe("[UNIT] Reward Entity", () => {
  describe("Reward.create", () => {
    it("should create reward with valid data", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const entity = Effect.runSync(effect);
      expect(entity.name).toBe("Test Reward");
      expect(entity.description).toBe("A test reward description");
      expect(entity.availableQuantity).toBe(10);
      expect(entity.coinCostPercentage.toNumber()).toBe(15);
      expect(entity.isHidden).toBe(false);
      expect(entity.tripId).toBe("trip-123");
      expect(entity.createdById).toBe("user-123");
      expect(entity.id).toBeDefined();
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty name", () => {
      const effect = Reward.create({
        name: "",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject name with only whitespace", () => {
      const effect = Reward.create({
        name: "   ",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty description", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject negative quantity", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: -1,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject fractional quantity", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10.5,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject coin cost percentage below 1", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 0,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject coin cost percentage above 100", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 101,
        tripId: "trip-123",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty tripId", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "",
        createdById: "user-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty createdById", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should create reward with images", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: ["image1.jpg", "image2.jpg"],
      });

      const entity = Effect.runSync(effect);
      expect(entity.images).toEqual(["image1.jpg", "image2.jpg"]);
    });

    it("should filter out empty image URLs", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: ["image1.jpg", "", "   ", "image2.jpg"],
      });

      const entity = Effect.runSync(effect);
      expect(entity.images).toEqual(["image1.jpg", "image2.jpg"]);
    });

    it("should reject too many images", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        images: Array(11).fill("image.jpg"),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should create hidden reward when isHidden is true", () => {
      const effect = Reward.create({
        name: "Test Reward",
        description: "A test reward description",
        availableQuantity: 10,
        coinCostPercentage: 15,
        tripId: "trip-123",
        createdById: "user-123",
        isHidden: true,
      });

      const entity = Effect.runSync(effect);
      expect(entity.isHidden).toBe(true);
    });
  });

  describe("Reward.update", () => {
    it("should update name", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Original Name",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = unwrapEffect(reward.update({ name: "New Name" }));
      expect(updated.name).toBe("New Name");
      expect(updated.description).toBe("A test reward description"); // Unchanged
      expect(updated.id).toBe(reward.id); // Same ID
    });

    it("should update description", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "Original description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = unwrapEffect(
        reward.update({ description: "New description" }),
      );
      expect(updated.description).toBe("New description");
      expect(updated.name).toBe("Test Reward"); // Unchanged
    });

    it("should update quantity", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = unwrapEffect(reward.update({ availableQuantity: 20 }));
      expect(updated.availableQuantity).toBe(20);
    });

    it("should update images", () => {
      const reward = unwrapEffect(
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

      const updated = unwrapEffect(
        reward.update({ images: ["new1.jpg", "new2.jpg"] }),
      );
      expect(updated.images).toEqual(["new1.jpg", "new2.jpg"]);
    });

    it("should reject invalid name update", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const effect = reward.update({ name: "" });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should update multiple fields at once", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const updated = unwrapEffect(
        reward.update({
          name: "New Name",
          availableQuantity: 5,
          coinCostPercentage: 25,
        }),
      );
      expect(updated.name).toBe("New Name");
      expect(updated.availableQuantity).toBe(5);
      expect(updated.coinCostPercentage.toNumber()).toBe(25);
    });
  });

  describe("Reward.hide / Reward.unhide", () => {
    it("should hide reward", () => {
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const decremented = unwrapEffect(reward.decrementQuantity(3));
      expect(decremented.availableQuantity).toBe(7);
    });

    it("should reject decrementing more than available", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 5,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const effect = reward.decrementQuantity(10);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject invalid decrement amount", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(
        Exit.isFailure(Effect.runSyncExit(reward.decrementQuantity(0))),
      ).toBe(true);
      expect(
        Exit.isFailure(Effect.runSyncExit(reward.decrementQuantity(-1))),
      ).toBe(true);
      expect(
        Exit.isFailure(Effect.runSyncExit(reward.decrementQuantity(1.5))),
      ).toBe(true);
    });
  });

  describe("Reward.incrementQuantity", () => {
    it("should increase quantity", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      const incremented = unwrapEffect(reward.incrementQuantity(5));
      expect(incremented.availableQuantity).toBe(15);
    });

    it("should reject invalid increment amount", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 15,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      expect(
        Exit.isFailure(Effect.runSyncExit(reward.incrementQuantity(0))),
      ).toBe(true);
      expect(
        Exit.isFailure(Effect.runSyncExit(reward.incrementQuantity(-1))),
      ).toBe(true);
      expect(
        Exit.isFailure(Effect.runSyncExit(reward.incrementQuantity(1.5))),
      ).toBe(true);
    });
  });

  describe("Reward.calculateDynamicCoinCost", () => {
    it("should calculate cost based on percentage of total points", () => {
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10, // 10%
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      // calculateTotalCost returns Effect<CoinAmount, ValidationError, never>
      const effect = reward.calculateTotalCost(3, 1000);
      const coinAmount = Effect.runSync(effect);
      expect(coinAmount.toNumber()).toBe(300); // 3 * 10% of 1000
    });

    it("should return zero cost for quantity 0", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      // calculateTotalCost returns Effect<CoinAmount, ValidationError, never>
      // Note: multiply allows 0, so this returns success with 0 cost
      const effect = reward.calculateTotalCost(0, 1000);
      const coinAmount = Effect.runSync(effect);
      expect(coinAmount.toNumber()).toBe(0);
    });

    it("should return error for negative quantity", () => {
      const reward = unwrapEffect(
        Reward.create({
          name: "Test Reward",
          description: "A test reward description",
          availableQuantity: 10,
          coinCostPercentage: 10,
          tripId: "trip-123",
          createdById: "user-123",
        }),
      );

      // calculateTotalCost returns Effect<CoinAmount, ValidationError, never>
      // multiply fails for negative numbers
      const effect = reward.calculateTotalCost(-1, 1000);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe("Reward.canAfford", () => {
    it("should return true when group has enough coins", () => {
      const reward = unwrapEffect(
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
      // canAfford returns Effect<boolean, ValidationError, never>
      const canAfford = Effect.runSync(reward.canAfford(groupCoins, 3, 1000));
      expect(canAfford).toBe(true); // Need 300, have 500
    });

    it("should return false when group doesn't have enough coins", () => {
      const reward = unwrapEffect(
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
      // canAfford returns Effect<boolean, ValidationError, never>
      const canAfford = Effect.runSync(reward.canAfford(groupCoins, 3, 1000));
      expect(canAfford).toBe(false); // Need 300, have 200
    });

    it("should return true when group has exactly enough coins", () => {
      const reward = unwrapEffect(
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
      // canAfford returns Effect<boolean, ValidationError, never>
      const canAfford = Effect.runSync(reward.canAfford(groupCoins, 3, 1000));
      expect(canAfford).toBe(true); // Need 300, have 300
    });
  });

  describe("Reward.isInStock", () => {
    it("should return true when quantity > 0", () => {
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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
      const reward = unwrapEffect(
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

describe("canTransitionPurchaseStatus", () => {
  it("should allow transition from BOUGHT to ACCEPTED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.BOUGHT,
        RewardPurchaseStatus.ACCEPTED,
      ),
    ).toBe(true);
  });

  it("should allow transition from BOUGHT to CANCELLED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.BOUGHT,
        RewardPurchaseStatus.CANCELLED,
      ),
    ).toBe(true);
  });

  it("should allow transition from ACCEPTED to IN_DELIVERY", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.ACCEPTED,
        RewardPurchaseStatus.IN_DELIVERY,
      ),
    ).toBe(true);
  });

  it("should allow transition from ACCEPTED to CANCELLED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.ACCEPTED,
        RewardPurchaseStatus.CANCELLED,
      ),
    ).toBe(true);
  });

  it("should allow transition from IN_DELIVERY to DELIVERED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.IN_DELIVERY,
        RewardPurchaseStatus.DELIVERED,
      ),
    ).toBe(true);
  });

  it("should allow transition from IN_DELIVERY to CANCELLED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.IN_DELIVERY,
        RewardPurchaseStatus.CANCELLED,
      ),
    ).toBe(true);
  });

  it("should NOT allow transition from BOUGHT to DELIVERED", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.BOUGHT,
        RewardPurchaseStatus.DELIVERED,
      ),
    ).toBe(false);
  });

  it("should NOT allow transition from CANCELLED to any status", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.CANCELLED,
        RewardPurchaseStatus.BOUGHT,
      ),
    ).toBe(false);
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.CANCELLED,
        RewardPurchaseStatus.ACCEPTED,
      ),
    ).toBe(false);
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.CANCELLED,
        RewardPurchaseStatus.DELIVERED,
      ),
    ).toBe(false);
  });

  it("should NOT allow transition from DELIVERED to any status", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.DELIVERED,
        RewardPurchaseStatus.CANCELLED,
      ),
    ).toBe(false);
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.DELIVERED,
        RewardPurchaseStatus.BOUGHT,
      ),
    ).toBe(false);
  });

  it("should allow same status transition", () => {
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.BOUGHT,
        RewardPurchaseStatus.BOUGHT,
      ),
    ).toBe(true);
    expect(
      canTransitionPurchaseStatus(
        RewardPurchaseStatus.DELIVERED,
        RewardPurchaseStatus.DELIVERED,
      ),
    ).toBe(true);
  });
});
