import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { Group } from "./group";
import { ValidationError, StateTransitionError } from "../../system/errors";
import { GroupStatus } from "../../group/enums";

describe("[UNIT] Group", () => {
  const validProps = {
    id: "group-123",
    tripId: "trip-456",
    name: "Test Group",
    description: "A test group for unit tests",
    image: "https://example.com/image.png",
    isDeleted: false,
    organizerId: "user-789",
    code: "JOIN123",
    coins: 100,
    status: GroupStatus.ACTIVE,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  // ============================================================================
  // Group.create() Factory Tests
  // ============================================================================
  describe("[UNIT] Group.create", () => {
    it("creates group with valid data", async () => {
      const result = await Effect.runPromise(Group.create(validProps));
      expect(result.id).toBe("group-123");
      expect(result.tripId).toBe("trip-456");
      expect(result.name).toBe("Test Group");
      expect(result.description).toBe("A test group for unit tests");
      expect(result.image).toBe("https://example.com/image.png");
      expect(result.organizerId).toBe("user-789");
      expect(result.code).toBe("JOIN123");
      expect(result.coins).toBe(100);
      expect(result.status).toBe(GroupStatus.ACTIVE);
      expect(result.isDeleted).toBe(false);
    });

    it("creates group with minimal required fields", async () => {
      const result = await Effect.runPromise(
        Group.create({
          tripId: "trip-456",
          name: "Minimal Group",
          organizerId: "user-789",
          code: "ABC",
        }),
      );
      expect(result.tripId).toBe("trip-456");
      expect(result.name).toBe("Minimal Group");
      expect(result.organizerId).toBe("user-789");
      expect(result.code).toBe("ABC");
      expect(result.coins).toBe(0);
      expect(result.status).toBe(GroupStatus.ACTIVE);
      expect(result.description).toBeNull();
      expect(result.image).toBeNull();
      expect(result.isDeleted).toBe(false);
    });

    it("generates UUID when id not provided", async () => {
      const result = await Effect.runPromise(
        Group.create({
          tripId: "trip-456",
          name: "Generated ID Group",
          organizerId: "user-789",
          code: "GEN123",
        }),
      );
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("fails for empty tripId", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, tripId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for whitespace-only tripId", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, tripId: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails for empty name", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, name: "" })),
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
        Effect.either(Group.create({ ...validProps, name: "   " })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("name");
      }
    });

    it("fails for name > 255 chars", async () => {
      const longName = "a".repeat(256);
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, name: longName })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("name");
        expect(result.left.message).toBe("name must be at most 255 characters");
      }
    });

    it("fails for description > 1000 chars", async () => {
      const longDescription = "a".repeat(1001);
      const result = await Effect.runPromise(
        Effect.either(
          Group.create({ ...validProps, description: longDescription }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
        expect(result.left.message).toBe(
          "description must be at most 1000 characters",
        );
      }
    });

    it("fails for image URL > 1000 chars", async () => {
      const longImageUrl = "https://example.com/" + "a".repeat(990);
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, image: longImageUrl })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("image");
        expect(result.left.message).toBe(
          "image must be at most 1000 characters",
        );
      }
    });

    it("fails for empty organizerId", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, organizerId: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("organizerId");
      }
    });

    it("fails for empty code", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, code: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("code");
        expect(result.left.message).toBe("code is required");
      }
    });

    it("fails for code < 3 chars", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, code: "AB" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("code");
        expect(result.left.message).toBe("code must be at least 3 characters");
      }
    });

    it("fails for code > 50 chars", async () => {
      const longCode = "a".repeat(51);
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, code: longCode })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("code");
        expect(result.left.message).toBe("code must be at most 50 characters");
      }
    });

    it("fails for negative coins", async () => {
      const result = await Effect.runPromise(
        Effect.either(Group.create({ ...validProps, coins: -1 })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("coins");
        expect(result.left.message).toBe("coins must be non-negative");
      }
    });

    it("accepts zero coins", async () => {
      const result = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );
      expect(result.coins).toBe(0);
    });

    it("accepts large positive coin amounts", async () => {
      const result = await Effect.runPromise(
        Group.create({ ...validProps, coins: 1000000 }),
      );
      expect(result.coins).toBe(1000000);
    });

    it("fails for invalid status", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          Group.create({
            ...validProps,
            status: "INVALID_STATUS" as GroupStatus,
          }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("status");
        expect(result.left.message).toContain("Invalid status");
      }
    });

    it("accepts all valid statuses", async () => {
      for (const status of Object.values(GroupStatus)) {
        const result = await Effect.runPromise(
          Group.create({ ...validProps, status }),
        );
        expect(result.status).toBe(status);
      }
    });

    it("preserves custom timestamps when provided", async () => {
      const customDate = new Date("2023-06-15");
      const result = await Effect.runPromise(
        Group.create({
          ...validProps,
          createdAt: customDate,
          updatedAt: customDate,
        }),
      );
      expect(result.createdAt).toEqual(customDate);
      expect(result.updatedAt).toEqual(customDate);
    });

    it("defaults isDeleted to false when not specified", async () => {
      const result = await Effect.runPromise(
        Group.create({
          tripId: "trip-456",
          name: "Test Group",
          organizerId: "user-789",
          code: "TEST123",
        }),
      );
      expect(result.isDeleted).toBe(false);
    });
  });

  // ============================================================================
  // State Machine Tests (ACTIVE -> DELETED)
  // ============================================================================
  describe("[UNIT] Group State Machine", () => {
    it("transitions from ACTIVE to DELETED", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const deleted = await Effect.runPromise(
        group.transitionStatus(GroupStatus.DELETED),
      );
      expect(deleted.status).toBe(GroupStatus.DELETED);
    });

    it("fails to transition from DELETED to ACTIVE", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, status: GroupStatus.DELETED }),
      );
      const result = await Effect.runPromise(
        Effect.either(group.transitionStatus(GroupStatus.ACTIVE)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
        expect(result.left.from).toBe(GroupStatus.DELETED);
        expect(result.left.to).toBe(GroupStatus.ACTIVE);
        expect(result.left.entityType).toBe("Group");
      }
    });

    it("fails to transition from ACTIVE to same state", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.transitionStatus(GroupStatus.ACTIVE)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
      }
    });

    it("markAsDeleted transitions to DELETED", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const deleted = await Effect.runPromise(group.markAsDeleted());
      expect(deleted.status).toBe(GroupStatus.DELETED);
    });

    it("markAsDeleted fails when already DELETED", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, status: GroupStatus.DELETED }),
      );
      const result = await Effect.runPromise(
        Effect.either(group.markAsDeleted()),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StateTransitionError);
      }
    });

    it("state transition updates updatedAt timestamp", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const beforeTransition = Date.now();
      const deleted = await Effect.runPromise(
        group.transitionStatus(GroupStatus.DELETED),
      );
      expect(deleted.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTransition,
      );
    });

    it("state transition preserves other fields", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const deleted = await Effect.runPromise(
        group.transitionStatus(GroupStatus.DELETED),
      );
      expect(deleted.id).toBe(group.id);
      expect(deleted.tripId).toBe(group.tripId);
      expect(deleted.name).toBe(group.name);
      expect(deleted.organizerId).toBe(group.organizerId);
      expect(deleted.code).toBe(group.code);
      expect(deleted.coins).toBe(group.coins);
      expect(deleted.createdAt).toBe(group.createdAt);
    });

    it("returns immutable instance from state transition", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      await Effect.runPromise(group.transitionStatus(GroupStatus.DELETED));
      expect(group.status).toBe(GroupStatus.ACTIVE);
    });
  });

  // ============================================================================
  // Coin Economy Tests (Business Critical)
  // ============================================================================
  describe("[UNIT] Group Coin Economy", () => {
    it("addCoins increases balance by specified amount", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      const updated = await Effect.runPromise(group.addCoins(50));
      expect(updated.coins).toBe(150);
    });

    it("addCoins works with zero starting balance", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );
      const updated = await Effect.runPromise(group.addCoins(100));
      expect(updated.coins).toBe(100);
    });

    it("addCoins works with large amounts", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );
      const updated = await Effect.runPromise(group.addCoins(1000000));
      expect(updated.coins).toBe(1000000);
    });

    it("addCoins fails for zero amount", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(Effect.either(group.addCoins(0)));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("addCoins fails for negative amount", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.addCoins(-10)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("subtractCoins decreases balance by specified amount", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      const updated = await Effect.runPromise(group.subtractCoins(30));
      expect(updated.coins).toBe(70);
    });

    it("subtractCoins can reduce balance to zero", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 50 }),
      );
      const updated = await Effect.runPromise(group.subtractCoins(50));
      expect(updated.coins).toBe(0);
    });

    it("subtractCoins fails for insufficient funds", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 50 }),
      );
      const result = await Effect.runPromise(
        Effect.either(group.subtractCoins(51)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("insufficient coins");
      }
    });

    it("subtractCoins fails when balance is zero", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );
      const result = await Effect.runPromise(
        Effect.either(group.subtractCoins(1)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toBe("insufficient coins");
      }
    });

    it("subtractCoins fails for zero amount", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.subtractCoins(0)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("subtractCoins fails for negative amount", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.subtractCoins(-10)),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("amount");
        expect(result.left.message).toBe("amount must be positive");
      }
    });

    it("coin operations update updatedAt timestamp", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const beforeAdd = Date.now();
      const afterAdd = await Effect.runPromise(group.addCoins(10));
      expect(afterAdd.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeAdd);

      const beforeSubtract = Date.now();
      const afterSubtract = await Effect.runPromise(afterAdd.subtractCoins(5));
      expect(afterSubtract.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeSubtract,
      );
    });

    it("coin operations preserve other fields", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(group.addCoins(50));
      expect(updated.id).toBe(group.id);
      expect(updated.tripId).toBe(group.tripId);
      expect(updated.name).toBe(group.name);
      expect(updated.organizerId).toBe(group.organizerId);
      expect(updated.status).toBe(group.status);
    });

    it("coin operations return immutable instances", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      await Effect.runPromise(group.addCoins(50));
      expect(group.coins).toBe(100);

      await Effect.runPromise(group.subtractCoins(30));
      expect(group.coins).toBe(100);
    });

    it("hasEnoughCoins returns true when balance is sufficient", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      expect(group.hasEnoughCoins(50)).toBe(true);
      expect(group.hasEnoughCoins(100)).toBe(true);
    });

    it("hasEnoughCoins returns false when balance is insufficient", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 50 }),
      );
      expect(group.hasEnoughCoins(51)).toBe(false);
      expect(group.hasEnoughCoins(100)).toBe(false);
    });

    it("hasEnoughCoins returns true for zero amount", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );
      expect(group.hasEnoughCoins(0)).toBe(true);
    });

    it("getCoinBalance returns current balance", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 250 }),
      );
      expect(group.getCoinBalance()).toBe(250);
    });

    it("complex coin transaction sequence works correctly", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 0 }),
      );

      // Add initial funds
      const step1 = await Effect.runPromise(group.addCoins(1000));
      expect(step1.coins).toBe(1000);

      // Make multiple purchases
      const step2 = await Effect.runPromise(step1.subtractCoins(200));
      expect(step2.coins).toBe(800);

      const step3 = await Effect.runPromise(step2.subtractCoins(150));
      expect(step3.coins).toBe(650);

      // Earn more coins
      const step4 = await Effect.runPromise(step3.addCoins(500));
      expect(step4.coins).toBe(1150);

      // Try to overspend (should fail)
      const result = await Effect.runPromise(
        Effect.either(step4.subtractCoins(1200)),
      );
      expect(result._tag).toBe("Left");

      // Balance should remain unchanged after failed operation
      expect(step4.coins).toBe(1150);
    });
  });

  // ============================================================================
  // Join Code Tests
  // ============================================================================
  describe("[UNIT] Group Join Code", () => {
    it("getJoinCode returns the code", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, code: "SECRET123" }),
      );
      expect(group.getJoinCode()).toBe("SECRET123");
    });

    it("matchesJoinCode returns true for exact match", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, code: "MATCH123" }),
      );
      expect(group.matchesJoinCode("MATCH123")).toBe(true);
    });

    it("matchesJoinCode returns false for non-matching code", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, code: "CORRECT123" }),
      );
      expect(group.matchesJoinCode("WRONG123")).toBe(false);
    });

    it("matchesJoinCode returns false for case mismatch", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, code: "UPPER123" }),
      );
      expect(group.matchesJoinCode("upper123")).toBe(false);
    });

    it("matchesJoinCode returns false for empty string", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      expect(group.matchesJoinCode("")).toBe(false);
    });

    it("can update join code", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, code: "OLD123" }),
      );
      const updated = await Effect.runPromise(group.update({ code: "NEW456" }));
      expect(updated.code).toBe("NEW456");
    });

    it("fails to update with invalid code", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.update({ code: "AB" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("code");
      }
    });
  });

  // ============================================================================
  // Organizer Management Tests
  // ============================================================================
  describe("[UNIT] Group Organizer Management", () => {
    it("isOrganizer returns true for matching organizer", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, organizerId: "organizer-123" }),
      );
      expect(group.isOrganizer("organizer-123")).toBe(true);
    });

    it("isOrganizer returns false for non-matching user", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, organizerId: "organizer-123" }),
      );
      expect(group.isOrganizer("different-user")).toBe(false);
    });

    it("isOrganizer returns false for empty string", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      expect(group.isOrganizer("")).toBe(false);
    });

    it("changeOrganizer updates the organizer", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, organizerId: "old-organizer" }),
      );
      const updated = await Effect.runPromise(
        group.changeOrganizer("new-organizer"),
      );
      expect(updated.organizerId).toBe("new-organizer");
      expect(updated.isOrganizer("new-organizer")).toBe(true);
      expect(updated.isOrganizer("old-organizer")).toBe(false);
    });

    it("changeOrganizer fails for empty organizerId", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.changeOrganizer("")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("organizerId");
      }
    });

    it("changeOrganizer fails for whitespace-only organizerId", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.changeOrganizer("   ")),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("organizerId");
      }
    });

    it("changeOrganizer updates updatedAt timestamp", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const beforeChange = Date.now();
      const updated = await Effect.runPromise(
        group.changeOrganizer("new-organizer"),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeChange);
    });

    it("changeOrganizer preserves other fields", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.changeOrganizer("new-organizer"),
      );
      expect(updated.id).toBe(group.id);
      expect(updated.tripId).toBe(group.tripId);
      expect(updated.name).toBe(group.name);
      expect(updated.coins).toBe(group.coins);
      expect(updated.status).toBe(group.status);
    });

    it("changeOrganizer returns immutable instance", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, organizerId: "original" }),
      );
      await Effect.runPromise(group.changeOrganizer("new"));
      expect(group.organizerId).toBe("original");
    });
  });

  // ============================================================================
  // Update Method Tests
  // ============================================================================
  describe("[UNIT] Group.update", () => {
    it("updates name", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({ name: "Updated Name" }),
      );
      expect(updated.name).toBe("Updated Name");
    });

    it("updates description", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({ description: "New description" }),
      );
      expect(updated.description).toBe("New description");
    });

    it("updates description to null", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, description: "Has description" }),
      );
      const updated = await Effect.runPromise(
        group.update({ description: null }),
      );
      expect(updated.description).toBeNull();
    });

    it("updates image", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({ image: "https://new-image.com/img.png" }),
      );
      expect(updated.image).toBe("https://new-image.com/img.png");
    });

    it("updates image to null", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, image: "https://example.com/img.png" }),
      );
      const updated = await Effect.runPromise(group.update({ image: null }));
      expect(updated.image).toBeNull();
    });

    it("updates code", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({ code: "NEWCODE" }),
      );
      expect(updated.code).toBe("NEWCODE");
    });

    it("updates multiple fields at once", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({
          name: "New Name",
          description: "New Desc",
          code: "NEW123",
        }),
      );
      expect(updated.name).toBe("New Name");
      expect(updated.description).toBe("New Desc");
      expect(updated.code).toBe("NEW123");
    });

    it("fails for empty name on update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.update({ name: "" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("name");
      }
    });

    it("fails for description > 1000 chars on update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.update({ description: "a".repeat(1001) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("description");
      }
    });

    it("fails for image > 1000 chars on update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(
          group.update({ image: "https://example.com/" + "a".repeat(990) }),
        ),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("image");
      }
    });

    it("fails for code < 3 chars on update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.update({ code: "AB" })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("code");
      }
    });

    it("fails for code > 50 chars on update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const result = await Effect.runPromise(
        Effect.either(group.update({ code: "a".repeat(51) })),
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("code");
      }
    });

    it("update refreshes updatedAt timestamp", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const beforeUpdate = Date.now();
      const updated = await Effect.runPromise(
        group.update({ name: "Updated" }),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it("update preserves unchanged fields", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      const updated = await Effect.runPromise(
        group.update({ name: "Updated Name" }),
      );
      expect(updated.id).toBe(group.id);
      expect(updated.tripId).toBe(group.tripId);
      expect(updated.organizerId).toBe(group.organizerId);
      expect(updated.coins).toBe(group.coins);
      expect(updated.status).toBe(group.status);
      expect(updated.createdAt).toBe(group.createdAt);
      expect(updated.description).toBe(group.description);
      expect(updated.image).toBe(group.image);
      expect(updated.code).toBe(group.code);
    });

    it("update returns immutable instance", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      await Effect.runPromise(group.update({ name: "Updated Name" }));
      expect(group.name).toBe("Test Group");
    });
  });

  // ============================================================================
  // Status Query Tests
  // ============================================================================
  describe("[UNIT] Group Status Queries", () => {
    it("isActive returns true for ACTIVE status with isDeleted false", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.ACTIVE,
          isDeleted: false,
        }),
      );
      expect(group.isActive()).toBe(true);
    });

    it("isActive returns false for DELETED status", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.DELETED,
          isDeleted: false,
        }),
      );
      expect(group.isActive()).toBe(false);
    });

    it("isActive returns false when isDeleted is true", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.ACTIVE,
          isDeleted: true,
        }),
      );
      expect(group.isActive()).toBe(false);
    });

    it("isDeletedGroup returns true for DELETED status", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.DELETED,
          isDeleted: false,
        }),
      );
      expect(group.isDeletedGroup()).toBe(true);
    });

    it("isDeletedGroup returns true when isDeleted is true", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.ACTIVE,
          isDeleted: true,
        }),
      );
      expect(group.isDeletedGroup()).toBe(true);
    });

    it("isDeletedGroup returns false for ACTIVE status with isDeleted false", async () => {
      const group = await Effect.runPromise(
        Group.create({
          ...validProps,
          status: GroupStatus.ACTIVE,
          isDeleted: false,
        }),
      );
      expect(group.isDeletedGroup()).toBe(false);
    });
  });

  // ============================================================================
  // Trip Association Tests
  // ============================================================================
  describe("[UNIT] Group Trip Association", () => {
    it("belongsToTrip returns true for matching trip", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, tripId: "trip-abc" }),
      );
      expect(group.belongsToTrip("trip-abc")).toBe(true);
    });

    it("belongsToTrip returns false for different trip", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, tripId: "trip-abc" }),
      );
      expect(group.belongsToTrip("trip-xyz")).toBe(false);
    });

    it("belongsToTrip returns false for empty string", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      expect(group.belongsToTrip("")).toBe(false);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("[UNIT] Group Immutability", () => {
    it("multiple operations chain correctly without mutation", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );

      // Chain multiple operations
      const step1 = await Effect.runPromise(group.addCoins(50));
      const step2 = await Effect.runPromise(step1.update({ name: "Step 2" }));
      const step3 = await Effect.runPromise(step2.changeOrganizer("new-org"));

      // Original unchanged
      expect(group.coins).toBe(100);
      expect(group.name).toBe("Test Group");
      expect(group.organizerId).toBe("user-789");

      // Each step has correct state
      expect(step1.coins).toBe(150);
      expect(step1.name).toBe("Test Group");

      expect(step2.coins).toBe(150);
      expect(step2.name).toBe("Step 2");

      expect(step3.coins).toBe(150);
      expect(step3.name).toBe("Step 2");
      expect(step3.organizerId).toBe("new-org");
    });

    it("original group unchanged after addCoins", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      await Effect.runPromise(group.addCoins(50));
      expect(group.coins).toBe(100);
    });

    it("original group unchanged after subtractCoins", async () => {
      const group = await Effect.runPromise(
        Group.create({ ...validProps, coins: 100 }),
      );
      await Effect.runPromise(group.subtractCoins(30));
      expect(group.coins).toBe(100);
    });

    it("original group unchanged after update", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      await Effect.runPromise(group.update({ name: "Updated" }));
      expect(group.name).toBe("Test Group");
    });

    it("original group unchanged after changeOrganizer", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      await Effect.runPromise(group.changeOrganizer("new-org"));
      expect(group.organizerId).toBe("user-789");
    });

    it("original group unchanged after state transition", async () => {
      const group = await Effect.runPromise(Group.create(validProps));
      await Effect.runPromise(group.transitionStatus(GroupStatus.DELETED));
      expect(group.status).toBe(GroupStatus.ACTIVE);
    });
  });
});
