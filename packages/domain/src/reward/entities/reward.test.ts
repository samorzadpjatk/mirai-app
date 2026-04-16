import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Reward } from "./reward";
import { ValidationError } from "../../system/errors";

describe("[UNIT] Reward", () => {
  const validProps = {
    id: "reward-123",
    name: "Test Reward",
    description: "A test reward for unit tests",
    availableQuantity: 10,
    isHidden: false,
    image: "https://example.com/reward.png",
    coinCost: 100,
    tripId: "trip-456",
    createdById: "user-789",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // Reward.create() Factory Tests
  // ============================================================================
  describe("[UNIT] Reward.create", () => {
    it("creates reward with valid data", async () => {
      const result = await Effect.runPromise(Reward.create(validProps));
      expect(result.id).toBe("reward-123");
      expect(result.name).toBe("Test Reward");
      expect(result.description).toBe("A test reward for unit tests");
      expect(result.availableQuantity).toBe(10);
      expect(result.isHidden).toBe(false);
      expect(result.image).toBe("https://example.com/reward.png");
      expect(result.coinCost).toBe(100);
      expect(result.tripId).toBe("trip-456");
      expect(result.createdById).toBe("user-789");
    });

    it("creates reward with minimal required fields", async () => {
      const result = await Effect.runPromise(
        Reward.create({
          name: "Minimal Reward",
          description: "Minimal description",
          availableQuantity: 5,
          coinCost: 50,
          tripId: "trip-456",
          createdById: "user-789",
        }),
      );
      expect(result.name).toBe("Minimal Reward");
      expect(result.description).toBe("Minimal description");
      expect(result.availableQuantity).toBe(5);
      expect(result.coinCost).toBe(50);
      expect(result.tripId).toBe("trip-456");
      expect(result.createdById).toBe("user-789");
      expect(result.isHidden).toBe(false);
      expect(result.image).toBeNull();
    });

    it("generates UUID when id not provided", async () => {
      const result = await Effect.runPromise(
        Reward.create({
          name: "Generated ID Reward",
          description: "Test description",
          availableQuantity: 1,
          coinCost: 10,
          tripId: "trip-456",
          createdById: "user-789",
        }),
      );
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("fails for empty name", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, name: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
        expect(result.left.message).toBe("name is required");
      }
    });

    it("fails for whitespace-only name", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, name: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("name");
        expect(result.left.message).toBe("name is required");
      }
    });

    it("fails for name > 255 chars", async () => {
      const longName = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, name: longName })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("name");
        expect(result.left.message).toBe("name must be at most 255 characters");
      }
    });

    it("fails for empty description", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, description: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe("description is required");
      }
    });

    it("fails for description > 2000 chars", async () => {
      const longDescription = "a".repeat(2001);
      const result = await Effect.runPromise(
        Effect.either(
          Reward.create({ ...validProps, description: longDescription }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe(
          "description must be at most 2000 characters",
        );
      }
    });

    it("fails for negative availableQuantity", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, availableQuantity: -1 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("availableQuantity");
        expect(result.left.message).toBe(
          "availableQuantity must be non-negative",
        );
      }
    });

    it("accepts zero availableQuantity", async () => {
      const result = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 0 }),
      );
      expect(result.availableQuantity).toBe(0);
    });

    it("fails for coinCost <= 0", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, coinCost: 0 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("coinCost");
        expect(result.left.message).toBe("coinCost must be positive");
      }
    });

    it("fails for negative coinCost", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, coinCost: -10 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("coinCost");
        expect(result.left.message).toBe("coinCost must be positive");
      }
    });

    it("accepts positive coinCost", async () => {
      const result = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 1 }),
      );
      expect(result.coinCost).toBe(1);
    });

    it("accepts large coinCost values", async () => {
      const result = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 1000000 }),
      );
      expect(result.coinCost).toBe(1000000);
    });

    it("fails for empty tripId", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, tripId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for empty createdById", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, createdById: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("createdById");
      }
    });

    it("fails for image URL > 1000 chars", async () => {
      const longImageUrl = "https://example.com/" + "a".repeat(990);
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, image: longImageUrl })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("image");
        expect(result.left.message).toBe(
          "image must be at most 1000 characters",
        );
      }
    });

    it("accepts null image", async () => {
      const result = await Effect.runPromise(
        Reward.create({ ...validProps, image: null }),
      );
      expect(result.image).toBeNull();
    });

    it("accepts isHidden true", async () => {
      const result = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true }),
      );
      expect(result.isHidden).toBe(true);
    });

    it("defaults isHidden to false", async () => {
      const result = await Effect.runPromise(
        Reward.create({
          name: "Test Reward",
          description: "Test description",
          availableQuantity: 5,
          coinCost: 50,
          tripId: "trip-456",
          createdById: "user-789",
        }),
      );
      expect(result.isHidden).toBe(false);
    });
  });

  // ============================================================================
  // Cost Validation Tests (Business Critical)
  // ============================================================================
  describe("[UNIT] Reward Cost Validation", () => {
    it("enforces positive coinCost on creation", async () => {
      const result = await Effect.runPromise(
        Effect.either(Reward.create({ ...validProps, coinCost: 0 })),
      );
      expect(result._tag).toBe("Left");
    });

    it("enforces positive coinCost on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(reward.update({ coinCost: -5 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("coinCost");
        expect(result.left.message).toBe("coinCost must be positive");
      }
    });

    it("allows updating to valid coinCost", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(reward.update({ coinCost: 200 }));
      expect(updated.coinCost).toBe(200);
    });

    it("preserves coinCost when not specified in update", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 150 }),
      );
      const updated = await Effect.runPromise(
        reward.update({ name: "New Name" }),
      );
      expect(updated.coinCost).toBe(150);
    });
  });

  // ============================================================================
  // Quantity Management Tests
  // ============================================================================
  describe("[UNIT] Reward Quantity Management", () => {
    it("reduceQuantity decreases available quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      const updated = await Effect.runPromise(reward.reduceQuantity(3));
      expect(updated.availableQuantity).toBe(7);
    });

    it("reduceQuantity can reduce to zero", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      const updated = await Effect.runPromise(reward.reduceQuantity(5));
      expect(updated.availableQuantity).toBe(0);
    });

    it("reduceQuantity fails for amount <= 0", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      const result = await Effect.runPromise(
        Effect.either(reward.reduceQuantity(0)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("reduceQuantity fails for negative amount", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      const result = await Effect.runPromise(
        Effect.either(reward.reduceQuantity(-5)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("reduceQuantity fails when amount exceeds available", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      const result = await Effect.runPromise(
        Effect.either(reward.reduceQuantity(6)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("insufficient quantity available");
      }
    });

    it("restock increases available quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      const updated = await Effect.runPromise(reward.restock(10));
      expect(updated.availableQuantity).toBe(15);
    });

    it("restock works from zero quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 0 }),
      );
      const updated = await Effect.runPromise(reward.restock(20));
      expect(updated.availableQuantity).toBe(20);
    });

    it("restock fails for amount <= 0", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      const result = await Effect.runPromise(Effect.either(reward.restock(0)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("restock fails for negative amount", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      const result = await Effect.runPromise(Effect.either(reward.restock(-5)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("quantity operations are immutable", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      await Effect.runPromise(reward.reduceQuantity(3));
      expect(reward.availableQuantity).toBe(10);

      await Effect.runPromise(reward.restock(5));
      expect(reward.availableQuantity).toBe(10);
    });

    it("quantity operations update updatedAt", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      const beforeReduce = Date.now();
      const reduced = await Effect.runPromise(reward.reduceQuantity(2));
      expect(reduced.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeReduce);

      const beforeRestock = Date.now();
      const restocked = await Effect.runPromise(reduced.restock(5));
      expect(restocked.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeRestock,
      );
    });

    it("complex quantity sequence works correctly", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 100 }),
      );

      // Reduce some
      const step1 = await Effect.runPromise(reward.reduceQuantity(30));
      expect(step1.availableQuantity).toBe(70);

      // Restock some
      const step2 = await Effect.runPromise(step1.restock(20));
      expect(step2.availableQuantity).toBe(90);

      // Reduce more
      const step3 = await Effect.runPromise(step2.reduceQuantity(40));
      expect(step3.availableQuantity).toBe(50);

      // Try to over-reduce (should fail)
      const result = await Effect.runPromise(
        Effect.either(step3.reduceQuantity(60)),
      );
      expect(result._tag).toBe("Left");

      // Quantity unchanged after failed operation
      expect(step3.availableQuantity).toBe(50);
    });
  });

  // ============================================================================
  // Visibility Toggling Tests
  // ============================================================================
  describe("[UNIT] Reward Visibility", () => {
    it("hide() sets isHidden to true", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      const hidden = reward.hide();
      expect(hidden.isHidden).toBe(true);
    });

    it("show() sets isHidden to false", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true }),
      );
      const visible = reward.show();
      expect(visible.isHidden).toBe(false);
    });

    it("hide() is idempotent", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true }),
      );
      const hidden = reward.hide();
      expect(hidden.isHidden).toBe(true);
    });

    it("show() is idempotent", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      const visible = reward.show();
      expect(visible.isHidden).toBe(false);
    });

    it("isHiddenReward() returns true when hidden", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true }),
      );
      expect(reward.isHiddenReward()).toBe(true);
    });

    it("isHiddenReward() returns false when visible", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      expect(reward.isHiddenReward()).toBe(false);
    });

    it("isVisible() returns true when visible", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      expect(reward.isVisible()).toBe(true);
    });

    it("isVisible() returns false when hidden", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true }),
      );
      expect(reward.isVisible()).toBe(false);
    });

    it("visibility operations are immutable", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      reward.hide();
      expect(reward.isHidden).toBe(false);

      reward.show();
      expect(reward.isHidden).toBe(false);
    });

    it("visibility operations update updatedAt", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      const beforeHide = Date.now();
      const hidden = reward.hide();
      expect(hidden.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeHide);

      const beforeShow = Date.now();
      const visible = hidden.show();
      expect(visible.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeShow);
    });

    it("update can change visibility", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      const updated = await Effect.runPromise(
        reward.update({ isHidden: true }),
      );
      expect(updated.isHidden).toBe(true);
    });
  });

  // ============================================================================
  // Affordability Checks Tests
  // ============================================================================
  describe("[UNIT] Reward Affordability", () => {
    it("canAfford returns true when group has enough coins", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 100 }),
      );
      expect(reward.canAfford(100)).toBe(true);
      expect(reward.canAfford(150)).toBe(true);
      expect(reward.canAfford(200)).toBe(true);
    });

    it("canAfford returns false when group lacks coins", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 100 }),
      );
      expect(reward.canAfford(99)).toBe(false);
      expect(reward.canAfford(50)).toBe(false);
      expect(reward.canAfford(0)).toBe(false);
    });

    it("canAfford handles edge case exactly equal", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 50 }),
      );
      expect(reward.canAfford(50)).toBe(true);
    });

    it("canPurchaseQuantity returns true for valid quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      expect(reward.canPurchaseQuantity(1)).toBe(true);
      expect(reward.canPurchaseQuantity(5)).toBe(true);
      expect(reward.canPurchaseQuantity(10)).toBe(true);
    });

    it("canPurchaseQuantity returns false for quantity > available", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      expect(reward.canPurchaseQuantity(6)).toBe(false);
      expect(reward.canPurchaseQuantity(10)).toBe(false);
    });

    it("canPurchaseQuantity returns false for quantity <= 0", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      expect(reward.canPurchaseQuantity(0)).toBe(false);
      expect(reward.canPurchaseQuantity(-1)).toBe(false);
      expect(reward.canPurchaseQuantity(-5)).toBe(false);
    });

    it("calculateTotalCost returns correct amount", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 50 }),
      );
      expect(reward.calculateTotalCost(1)).toBe(50);
      expect(reward.calculateTotalCost(2)).toBe(100);
      expect(reward.calculateTotalCost(5)).toBe(250);
      expect(reward.calculateTotalCost(10)).toBe(500);
    });

    it("calculateTotalCost handles zero quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 100 }),
      );
      expect(reward.calculateTotalCost(0)).toBe(0);
    });

    it("complete purchase workflow: check affordability then reduce", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 50, availableQuantity: 10 }),
      );
      const groupCoins = 200;
      const desiredQuantity = 3;

      // Check if affordable
      const totalCost = reward.calculateTotalCost(desiredQuantity);
      const canAfford = reward.canAfford(groupCoins);
      const canPurchase = reward.canPurchaseQuantity(desiredQuantity);

      expect(canAfford).toBe(true);
      expect(canPurchase).toBe(true);
      expect(totalCost).toBe(150);

      // Execute purchase
      const updated = await Effect.runPromise(
        reward.reduceQuantity(desiredQuantity),
      );
      expect(updated.availableQuantity).toBe(7);
    });

    it("purchase blocked when not affordable", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 100, availableQuantity: 5 }),
      );
      const groupCoins = 50;

      expect(reward.canAfford(groupCoins)).toBe(false);
    });

    it("purchase blocked when insufficient quantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, coinCost: 10, availableQuantity: 3 }),
      );
      const desiredQuantity = 5;

      expect(reward.canPurchaseQuantity(desiredQuantity)).toBe(false);
    });
  });

  // ============================================================================
  // Update Method Tests
  // ============================================================================
  describe("[UNIT] Reward.update", () => {
    it("updates name", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ name: "Updated Name" }),
      );
      expect(updated.name).toBe("Updated Name");
    });

    it("updates description", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ description: "New description" }),
      );
      expect(updated.description).toBe("New description");
    });

    it("updates availableQuantity", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ availableQuantity: 20 }),
      );
      expect(updated.availableQuantity).toBe(20);
    });

    it("updates coinCost", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(reward.update({ coinCost: 200 }));
      expect(updated.coinCost).toBe(200);
    });

    it("updates isHidden", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ isHidden: true }),
      );
      expect(updated.isHidden).toBe(true);
    });

    it("updates image", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ image: "https://new-image.com/img.png" }),
      );
      expect(updated.image).toBe("https://new-image.com/img.png");
    });

    it("updates image to null", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, image: "https://example.com/img.png" }),
      );
      const updated = await Effect.runPromise(reward.update({ image: null }));
      expect(updated.image).toBeNull();
    });

    it("updates multiple fields at once", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({
          name: "New Name",
          description: "New Desc",
          coinCost: 150,
          availableQuantity: 25,
        }),
      );
      expect(updated.name).toBe("New Name");
      expect(updated.description).toBe("New Desc");
      expect(updated.coinCost).toBe(150);
      expect(updated.availableQuantity).toBe(25);
    });

    it("fails for empty name on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(reward.update({ name: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails for description > 2000 chars on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(reward.update({ description: "a".repeat(2001) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for negative availableQuantity on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(reward.update({ availableQuantity: -1 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("availableQuantity");
        expect(result.left.message).toBe(
          "availableQuantity must be non-negative",
        );
      }
    });

    it("fails for coinCost <= 0 on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(reward.update({ coinCost: 0 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("coinCost");
        expect(result.left.message).toBe("coinCost must be positive");
      }
    });

    it("fails for image > 1000 chars on update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(
          reward.update({ image: "https://example.com/" + "a".repeat(990) }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("image");
      }
    });

    it("update refreshes updatedAt timestamp", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const beforeUpdate = Date.now();
      const updated = await Effect.runPromise(
        reward.update({ name: "Updated" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("update preserves unchanged fields", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      const updated = await Effect.runPromise(
        reward.update({ name: "Updated Name" }),
      );
      expect(updated.id).toBe(reward.id);
      expect(updated.description).toBe(reward.description);
      expect(updated.coinCost).toBe(reward.coinCost);
      expect(updated.availableQuantity).toBe(reward.availableQuantity);
      expect(updated.tripId).toBe(reward.tripId);
      expect(updated.createdById).toBe(reward.createdById);
      expect(updated.createdAt).toBe(reward.createdAt);
    });

    it("update returns immutable instance", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      await Effect.runPromise(reward.update({ name: "Updated Name" }));
      expect(reward.name).toBe("Test Reward");
    });
  });

  // ============================================================================
  // Stock Status Tests
  // ============================================================================
  describe("[UNIT] Reward Stock Status", () => {
    it("isInStock returns true when quantity > 0", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 1 }),
      );
      expect(reward.isInStock()).toBe(true);
    });

    it("isInStock returns false when quantity = 0", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 0 }),
      );
      expect(reward.isInStock()).toBe(false);
    });

    it("getAvailabilityStatus returns 'hidden' when hidden", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: true, availableQuantity: 10 }),
      );
      expect(reward.getAvailabilityStatus()).toBe("hidden");
    });

    it("getAvailabilityStatus returns 'in_stock' when visible and has stock", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false, availableQuantity: 5 }),
      );
      expect(reward.getAvailabilityStatus()).toBe("in_stock");
    });

    it("getAvailabilityStatus returns 'out_of_stock' when visible and no stock", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false, availableQuantity: 0 }),
      );
      expect(reward.getAvailabilityStatus()).toBe("out_of_stock");
    });
  });

  // ============================================================================
  // Trip and Creator Association Tests
  // ============================================================================
  describe("[UNIT] Reward Trip and Creator Association", () => {
    it("belongsToTrip returns true for matching trip", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, tripId: "trip-abc" }),
      );
      expect(reward.belongsToTrip("trip-abc")).toBe(true);
    });

    it("belongsToTrip returns false for different trip", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, tripId: "trip-abc" }),
      );
      expect(reward.belongsToTrip("trip-xyz")).toBe(false);
    });

    it("wasCreatedBy returns true for matching creator", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, createdById: "user-123" }),
      );
      expect(reward.wasCreatedBy("user-123")).toBe(true);
    });

    it("wasCreatedBy returns false for different user", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, createdById: "user-123" }),
      );
      expect(reward.wasCreatedBy("user-456")).toBe(false);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("[UNIT] Reward Immutability", () => {
    it("multiple operations chain correctly without mutation", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 20 }),
      );

      // Chain multiple operations
      const step1 = await Effect.runPromise(reward.reduceQuantity(5));
      const step2 = await Effect.runPromise(step1.restock(10));
      const step3 = step2.hide();
      const step4 = await Effect.runPromise(step3.update({ name: "Step 4" }));

      // Original unchanged
      expect(reward.availableQuantity).toBe(20);
      expect(reward.isHidden).toBe(false);
      expect(reward.name).toBe("Test Reward");

      // Each step has correct state
      expect(step1.availableQuantity).toBe(15);
      expect(step1.isHidden).toBe(false);

      expect(step2.availableQuantity).toBe(25);
      expect(step2.isHidden).toBe(false);

      expect(step3.availableQuantity).toBe(25);
      expect(step3.isHidden).toBe(true);

      expect(step4.availableQuantity).toBe(25);
      expect(step4.isHidden).toBe(true);
      expect(step4.name).toBe("Step 4");
    });

    it("original reward unchanged after reduceQuantity", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 10 }),
      );
      await Effect.runPromise(reward.reduceQuantity(3));
      expect(reward.availableQuantity).toBe(10);
    });

    it("original reward unchanged after restock", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, availableQuantity: 5 }),
      );
      await Effect.runPromise(reward.restock(10));
      expect(reward.availableQuantity).toBe(5);
    });

    it("original reward unchanged after hide/show", async () => {
      const reward = await Effect.runPromise(
        Reward.create({ ...validProps, isHidden: false }),
      );
      reward.hide();
      expect(reward.isHidden).toBe(false);

      reward.show();
      expect(reward.isHidden).toBe(false);
    });

    it("original reward unchanged after update", async () => {
      const reward = await Effect.runPromise(Reward.create(validProps));
      await Effect.runPromise(reward.update({ name: "Updated" }));
      expect(reward.name).toBe("Test Reward");
    });
  });
});
