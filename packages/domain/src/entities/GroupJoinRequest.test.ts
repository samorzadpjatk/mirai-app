import { describe, it, expect } from "bun:test";
import { GroupJoinRequest } from "./GroupJoinRequest";

describe("[UNIT] GroupJoinRequest Entity", () => {
  describe("GroupJoinRequest.create", () => {
    it("should create join request with valid data", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.groupId).toBe("group-456");
        expect(result.value.userId).toBe("user-789");
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should reject empty tripId", () => {
      const result = GroupJoinRequest.create({
        tripId: "",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty groupId", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "",
        userId: "user-789",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty userId", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject same userId and groupId", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "same-id",
        userId: "same-id",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("different");
      }
    });
  });

  describe("GroupJoinRequest.getUniqueKey", () => {
    it("should return unique key for trip+user combination", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getUniqueKey()).toBe("trip-123:user-789");
      }
    });
  });

  describe("GroupJoinRequest.getCompositeId", () => {
    it("should return full composite ID", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getCompositeId()).toBe(
          "trip-123:group-456:user-789",
        );
      }
    });
  });

  describe("GroupJoinRequest.matches", () => {
    it("should match correct trip and user", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("trip-123", "user-789")).toBe(true);
        expect(result.value.matches("trip-123", "other-user")).toBe(false);
        expect(result.value.matches("other-trip", "user-789")).toBe(false);
      }
    });
  });

  describe("GroupJoinRequest.isForTrip", () => {
    it("should check if for specific trip", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForTrip("trip-123")).toBe(true);
        expect(result.value.isForTrip("other-trip")).toBe(false);
      }
    });
  });

  describe("GroupJoinRequest.isForGroup", () => {
    it("should check if for specific group", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForGroup("group-456")).toBe(true);
        expect(result.value.isForGroup("other-group")).toBe(false);
      }
    });
  });

  describe("GroupJoinRequest.isFromUser", () => {
    it("should check if from specific user", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isFromUser("user-789")).toBe(true);
        expect(result.value.isFromUser("other-user")).toBe(false);
      }
    });
  });

  describe("GroupJoinRequest.getAgeMs / isOlderThan", () => {
    it("should calculate age correctly", () => {
      const result = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        // Age should be non-negative (very small since just created)
        expect(result.value.getAgeMs()).toBeGreaterThanOrEqual(0);
        expect(result.value.isOlderThan(-1)).toBe(true);
      }
    });
  });
});
