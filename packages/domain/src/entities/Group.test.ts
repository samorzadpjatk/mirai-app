import { describe, it, expect } from "bun:test";
import { Group, GroupStatus } from "./Group";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

describe("[UNIT] Group Entity", () => {
  describe("Group.create", () => {
    it("should create group with minimum required fields", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Alpha",
        organizerId: "user-456",
        code: "ALPHA2026",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.name).toBe("Team Alpha");
        expect(result.value.organizerId).toBe("user-456");
        expect(result.value.code).toBe("ALPHA2026");
        expect(result.value.coins).toBe(0);
        expect(result.value.isDeleted()).toBe(false);
        expect(result.value.status).toBe(GroupStatus.ACTIVE);
      }
    });

    it("should create group with all fields", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Beta",
        description: "The best team ever",
        image: "https://example.com/team.jpg",
        organizerId: "user-789",
        code: "BETA2026",
        coins: 100,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.description).toBe("The best team ever");
        expect(result.value.image).toBe("https://example.com/team.jpg");
        expect(result.value.coins).toBe(100);
      }
    });

    it("should reject empty tripId", () => {
      const result = Group.create({
        tripId: "",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("tripId");
      }
    });

    it("should reject empty name", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("name");
      }
    });

    it("should reject name longer than 100 characters", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "a".repeat(101),
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("name");
      }
    });

    it("should reject empty organizerId", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "",
        code: "CODE123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("organizerId");
      }
    });

    it("should reject empty code", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("code");
      }
    });

    it("should reject code longer than 50 characters", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "a".repeat(51),
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("code");
      }
    });

    it("should reject negative coins", () => {
      const result = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: -10,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("coins");
      }
    });
  });

  describe("Group.updateDetails", () => {
    it("should update name and description", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Original Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const group = groupResult.value;
      const updatedResult = group.updateDetails({
        name: "Updated Name",
        description: "Updated description",
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.name).toBe("Updated Name");
        expect(updatedResult.value.description).toBe("Updated description");
        expect(updatedResult.value.id).toBe(group.id);
      }
    });

    it("should reject invalid name update", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Original Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const result = groupResult.value.updateDetails({ name: "" });
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject update if group is deleted", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Original Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const deletedResult = groupResult.value.markAsDeleted();
      expect(deletedResult.kind).toBe("ok");
      if (deletedResult.kind !== "ok") return;

      const result = deletedResult.value.updateDetails({ name: "New Name" });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Group.changeOrganizer", () => {
    it("should change organizer", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const group = groupResult.value;
      const updatedResult = group.changeOrganizer("user-456");

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.organizerId).toBe("user-456");
        expect(updatedResult.value.id).toBe(group.id);
      }
    });

    it("should reject empty organizerId", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const result = groupResult.value.changeOrganizer("");
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("organizerId");
      }
    });
  });

  describe("Group.addCoins", () => {
    it("should add coins to balance", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 100,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const group = groupResult.value;
      const updatedResult = group.addCoins(50);

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.coins).toBe(150);
      }
    });

    it("should reject negative amount", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 100,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const result = groupResult.value.addCoins(-10);
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("amount");
      }
    });
  });

  describe("Group.spendCoins", () => {
    it("should subtract coins from balance", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 100,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const group = groupResult.value;
      const updatedResult = group.spendCoins(30);

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.coins).toBe(70);
      }
    });

    it("should reject spending more than balance", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 50,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const result = groupResult.value.spendCoins(100);
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("coins");
      }
    });
  });

  describe("Group.markAsDeleted", () => {
    it("should mark group as deleted", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const group = groupResult.value;
      const updatedResult = group.markAsDeleted();

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.isDeleted()).toBe(true);
        expect(updatedResult.value.status).toBe(GroupStatus.DELETED);
      }
    });

    it("should reject deleting already deleted group", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        status: GroupStatus.DELETED,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind !== "ok") return;

      const result = groupResult.value.markAsDeleted();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Group.isActive", () => {
    it("should return true for active group", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind === "ok") {
        expect(groupResult.value.isActive()).toBe(true);
      }
    });

    it("should return false for deleted group", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind === "ok") {
        const deletedResult = groupResult.value.markAsDeleted();
        expect(deletedResult.kind).toBe("ok");
        if (deletedResult.kind === "ok") {
          expect(deletedResult.value.isActive()).toBe(false);
        }
      }
    });
  });

  describe("Group.hasEnoughCoins", () => {
    it("should return true when balance is sufficient", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 100,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind === "ok") {
        expect(groupResult.value.hasEnoughCoins(50)).toBe(true);
        expect(groupResult.value.hasEnoughCoins(100)).toBe(true);
      }
    });

    it("should return false when balance is insufficient", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 50,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind === "ok") {
        expect(groupResult.value.hasEnoughCoins(100)).toBe(false);
      }
    });
  });

  describe("Group.getBalance", () => {
    it("should return current coin balance", () => {
      const groupResult = Group.create({
        tripId: "trip-123",
        name: "Team Name",
        organizerId: "user-123",
        code: "CODE123",
        coins: 150,
      });

      expect(groupResult.kind).toBe("ok");
      if (groupResult.kind === "ok") {
        expect(groupResult.value.getBalance()).toBe(150);
      }
    });
  });
});
