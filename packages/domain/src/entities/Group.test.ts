import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { Group, GroupStatus } from "./Group";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] Group Entity", () => {
  describe("Group.create", () => {
    it("should create group with minimum required fields", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Alpha",
        organizerId: "user-456",
        code: "ALPHA2026",
      });

      const group = Effect.runSync(effect);
      expect(group.id).toBeDefined();
      expect(group.tripId).toBe("trip-123");
      expect(group.name).toBe("Team Alpha");
      expect(group.organizerId).toBe("user-456");
      expect(group.code).toBe("ALPHA2026");
      expect(group.coins).toBe(0);
      expect(group.isDeleted()).toBe(false);
      expect(group.status).toBe(GroupStatus.ACTIVE);
    });

    it("should create group with all fields", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Beta",
        description: "The best team ever",
        image: "https://example.com/team.jpg",
        organizerId: "user-789",
        code: "BETA2026",
        coins: 100,
      });

      const group = Effect.runSync(effect);
      expect(group.description).toBe("The best team ever");
      expect(group.image).toBe("https://example.com/team.jpg");
      expect(group.coins).toBe(100);
    });

    it("should reject empty tripId", () => {
      const effect = Group.create({
        tripId: "",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("tripId");
      }
    });

    it("should reject empty name", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "",
        organizerId: "user-123",
        code: "CODE123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("name");
      }
    });

    it("should reject name longer than 100 characters", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "a".repeat(101),
        organizerId: "user-123",
        code: "CODE123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("name");
      }
    });

    it("should reject empty organizerId", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "",
        code: "CODE123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("organizerId");
      }
    });

    it("should reject empty code", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("code");
      }
    });

    it("should reject code longer than 50 characters", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "a".repeat(51),
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("code");
      }
    });

    it("should reject negative coins", () => {
      const effect = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: -10,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("coins");
      }
    });
  });

  describe("Group.updateDetails", () => {
    it("should update name and description", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Original Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const updated = Effect.runSync(
        group.updateDetails({
          name: "Updated Name",
          description: "Updated description",
        }),
      );

      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
      expect(updated.id).toBe(group.id);
    });

    it("should reject invalid name update", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Original Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const effect = group.updateDetails({ name: "" });
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject update if group is deleted", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Original Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const deleted = Effect.runSync(group.markAsDeleted());
      const effect = deleted.updateDetails({ name: "New Name" });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Group.changeOrganizer", () => {
    it("should change organizer", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const updated = Effect.runSync(group.changeOrganizer("user-456"));

      expect(updated.organizerId).toBe("user-456");
      expect(updated.id).toBe(group.id);
    });

    it("should reject empty organizerId", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const effect = group.changeOrganizer("");
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("organizerId");
      }
    });
  });

  describe("Group.addCoins", () => {
    it("should add coins to balance", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 100,
        }),
      );

      const updated = Effect.runSync(group.addCoins(50));

      expect(updated.coins).toBe(150);
    });

    it("should reject negative amount", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 100,
        }),
      );

      const effect = group.addCoins(-10);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("amount");
      }
    });
  });

  describe("Group.spendCoins", () => {
    it("should subtract coins from balance", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 100,
        }),
      );

      const updated = Effect.runSync(group.spendCoins(30));

      expect(updated.coins).toBe(70);
    });

    it("should reject spending more than balance", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 50,
        }),
      );

      const effect = group.spendCoins(100);
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.field).toBe("coins");
      }
    });
  });

  describe("Group.markAsDeleted", () => {
    it("should mark group as deleted", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const updated = Effect.runSync(group.markAsDeleted());

      expect(updated.isDeleted()).toBe(true);
      expect(updated.status).toBe(GroupStatus.DELETED);
    });

    it("should reject deleting already deleted group", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          status: GroupStatus.DELETED,
        }),
      );

      const effect = group.markAsDeleted();
      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        const error = exit.cause.error;
        expect(error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Group.isActive", () => {
    it("should return true for active group", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      expect(group.isActive()).toBe(true);
    });

    it("should return false for deleted group", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
        }),
      );

      const deleted = Effect.runSync(group.markAsDeleted());
      expect(deleted.isActive()).toBe(false);
    });
  });

  describe("Group.hasEnoughCoins", () => {
    it("should return true when balance is sufficient", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 100,
        }),
      );

      expect(group.hasEnoughCoins(50)).toBe(true);
      expect(group.hasEnoughCoins(100)).toBe(true);
    });

    it("should return false when balance is insufficient", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 50,
        }),
      );

      expect(group.hasEnoughCoins(100)).toBe(false);
    });
  });

  describe("Group.getBalance", () => {
    it("should return current coin balance", () => {
      const group = Effect.runSync(
        Group.create({
          tripId: "trip-123",
          name: "Team Name",
          organizerId: "user-123",
          code: "CODE123",
          coins: 150,
        }),
      );

      expect(group.getBalance()).toBe(150);
    });
  });
});
