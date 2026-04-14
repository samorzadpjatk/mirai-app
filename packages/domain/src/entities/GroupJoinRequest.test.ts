import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import { GroupJoinRequest } from "./GroupJoinRequest";
import { ValidationError } from "../errors";

describe("[UNIT] GroupJoinRequest Entity", () => {
  describe("[UNIT] GroupJoinRequest.create", () => {
    it("should create join request with valid data", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.id).toBeDefined();
      expect(request.tripId).toBe("trip-123");
      expect(request.groupId).toBe("group-456");
      expect(request.userId).toBe("user-789");
      expect(request.createdAt).toBeInstanceOf(Date);
    });

    it("should reject empty tripId", () => {
      const effect = GroupJoinRequest.create({
        tripId: "",
        groupId: "group-456",
        userId: "user-789",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty groupId", () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "",
        userId: "user-789",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject empty userId", () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
      }
    });

    it("should reject same userId and groupId", () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "same-id",
        userId: "same-id",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.message).toContain("different");
      }
    });
  });

  describe("[UNIT] GroupJoinRequest.getUniqueKey", () => {
    it("should return unique key for trip+user combination", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.getUniqueKey()).toBe("trip-123:user-789");
    });
  });

  describe("[UNIT] GroupJoinRequest.getCompositeId", () => {
    it("should return full composite ID", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.getCompositeId()).toBe("trip-123:group-456:user-789");
    });
  });

  describe("[UNIT] GroupJoinRequest.matches", () => {
    it("should match correct trip and user", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.matches("trip-123", "user-789")).toBe(true);
      expect(request.matches("trip-123", "other-user")).toBe(false);
      expect(request.matches("other-trip", "user-789")).toBe(false);
    });
  });

  describe("[UNIT] GroupJoinRequest.isForTrip", () => {
    it("should check if for specific trip", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.isForTrip("trip-123")).toBe(true);
      expect(request.isForTrip("other-trip")).toBe(false);
    });
  });

  describe("[UNIT] GroupJoinRequest.isForGroup", () => {
    it("should check if for specific group", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.isForGroup("group-456")).toBe(true);
      expect(request.isForGroup("other-group")).toBe(false);
    });
  });

  describe("[UNIT] GroupJoinRequest.isFromUser", () => {
    it("should check if from specific user", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      expect(request.isFromUser("user-789")).toBe(true);
      expect(request.isFromUser("other-user")).toBe(false);
    });
  });

  describe("[UNIT] GroupJoinRequest.getAgeMs / isOlderThan", () => {
    it("should calculate age correctly", () => {
      const request = Effect.runSync(
        GroupJoinRequest.create({
          tripId: "trip-123",
          groupId: "group-456",
          userId: "user-789",
        }),
      );

      // Age should be non-negative (very small since just created)
      expect(request.getAgeMs()).toBeGreaterThanOrEqual(0);
      expect(request.isOlderThan(-1)).toBe(true);
    });
  });
});
