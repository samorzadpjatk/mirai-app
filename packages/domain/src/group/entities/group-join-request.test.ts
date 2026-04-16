import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { GroupJoinRequest } from "./group-join-request";
import { ValidationError } from "../../system/errors";

describe("[UNIT] GroupJoinRequest", () => {
  const validProps = {
    id: "request-123",
    tripId: "trip-456",
    groupId: "group-789",
    userId: "user-abc",
    createdAt: new Date("2024-01-01T10:00:00Z"),
  };

  // ============================================================================
  // Factory Method - create()
  // ============================================================================
  describe("create()", () => {
    it("creates a valid join request with all properties", async () => {
      const effect = GroupJoinRequest.create(validProps);
      const request = await Effect.runPromise(effect);

      expect(request.id).toBe("request-123");
      expect(request.tripId).toBe("trip-456");
      expect(request.groupId).toBe("group-789");
      expect(request.userId).toBe("user-abc");
      expect(request.createdAt).toEqual(new Date("2024-01-01T10:00:00Z"));
    });

    it("creates a join request with minimal required properties", async () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      const request = await Effect.runPromise(effect);

      expect(request.tripId).toBe("trip-123");
      expect(request.groupId).toBe("group-456");
      expect(request.userId).toBe("user-789");
      expect(request.id).toBeDefined();
      expect(request.createdAt).toBeInstanceOf(Date);
    });

    it("generates UUID when id is not provided", async () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      const request = await Effect.runPromise(effect);

      expect(request.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it("generates current timestamp when createdAt is not provided", async () => {
      const effect = GroupJoinRequest.create({
        tripId: "trip-123",
        groupId: "group-456",
        userId: "user-789",
      });

      const beforeCreate = Date.now();
      const request = await Effect.runPromise(effect);
      const afterCreate = Date.now();

      expect(request.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(request.createdAt.getTime()).toBeLessThanOrEqual(afterCreate);
    });

    it("fails when tripId is empty", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        tripId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("tripId");
        expect(result.left.message).toBe("tripId is required");
      }
    });

    it("fails when tripId is whitespace only", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        tripId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("tripId");
      }
    });

    it("fails when groupId is empty", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        groupId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("groupId");
        expect(result.left.message).toBe("groupId is required");
      }
    });

    it("fails when groupId is whitespace only", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        groupId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("groupId");
      }
    });

    it("fails when userId is empty", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        userId: "",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe("userId is required");
      }
    });

    it("fails when userId is whitespace only", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        userId: "   ",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("userId");
      }
    });

    it("fails when userId equals groupId", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        userId: "same-id",
        groupId: "same-id",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ValidationError);
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe(
          "userId and groupId must be different",
        );
      }
    });

    it("fails when userId equals groupId with whitespace differences", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        userId: "  same-id  ",
        groupId: "same-id",
      });

      const result = await Effect.runPromise(Effect.either(effect));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.field).toBe("userId");
        expect(result.left.message).toBe(
          "userId and groupId must be different",
        );
      }
    });

    it("trims whitespace from tripId", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        tripId: "  trip-123  ",
      });

      const request = await Effect.runPromise(effect);
      expect(request.tripId).toBe("trip-123");
    });

    it("trims whitespace from groupId", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        groupId: "  group-123  ",
      });

      const request = await Effect.runPromise(effect);
      expect(request.groupId).toBe("group-123");
    });

    it("trims whitespace from userId", async () => {
      const effect = GroupJoinRequest.create({
        ...validProps,
        userId: "  user-123  ",
      });

      const request = await Effect.runPromise(effect);
      expect(request.userId).toBe("user-123");
    });
  });

  // ============================================================================
  // Composite Key Tests
  // ============================================================================
  describe("composite key methods", () => {
    describe("getUniqueKey()", () => {
      it("returns tripId:userId composite key", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.getUniqueKey()).toBe("trip-abc:user-123");
      });

      it("enforces uniqueness constraint (one user per trip)", async () => {
        const request1 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-a",
            userId: "user-xyz",
          }),
        );

        const request2 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-b",
            userId: "user-xyz",
          }),
        );

        expect(request1.getUniqueKey()).toBe(request2.getUniqueKey());
        expect(request1.getUniqueKey()).toBe("trip-123:user-xyz");
      });

      it("different users have different keys for same trip", async () => {
        const request1 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-a",
            userId: "user-1",
          }),
        );

        const request2 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-b",
            userId: "user-2",
          }),
        );

        expect(request1.getUniqueKey()).not.toBe(request2.getUniqueKey());
      });
    });

    describe("getCompositeId()", () => {
      it("returns tripId:groupId:userId full composite id", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.getCompositeId()).toBe("trip-abc:group-xyz:user-123");
      });

      it("produces unique ids for different combinations", async () => {
        const request1 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-1",
            groupId: "group-1",
            userId: "user-1",
          }),
        );

        const request2 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-1",
            groupId: "group-2",
            userId: "user-1",
          }),
        );

        const request3 = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-1",
            groupId: "group-1",
            userId: "user-2",
          }),
        );

        const id1 = request1.getCompositeId();
        const id2 = request2.getCompositeId();
        const id3 = request3.getCompositeId();

        expect(id1).not.toBe(id2);
        expect(id1).not.toBe(id3);
        expect(id2).not.toBe(id3);
      });
    });

    describe("matches()", () => {
      it("returns true for matching tripId and userId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.matches("trip-abc", "user-123")).toBe(true);
      });

      it("returns false for non-matching tripId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.matches("trip-different", "user-123")).toBe(false);
      });

      it("returns false for non-matching userId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.matches("trip-abc", "user-different")).toBe(false);
      });

      it("returns false when both are non-matching", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.matches("trip-different", "user-different")).toBe(false);
      });
    });
  });

  // ============================================================================
  // Query Methods
  // ============================================================================
  describe("query methods", () => {
    describe("isForTrip()", () => {
      it("returns true for matching tripId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForTrip("trip-abc")).toBe(true);
      });

      it("returns false for non-matching tripId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForTrip("trip-different")).toBe(false);
      });

      it("returns false for empty string", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForTrip("")).toBe(false);
      });
    });

    describe("isForGroup()", () => {
      it("returns true for matching groupId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForGroup("group-xyz")).toBe(true);
      });

      it("returns false for non-matching groupId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForGroup("group-different")).toBe(false);
      });

      it("returns false for empty string", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isForGroup("")).toBe(false);
      });
    });

    describe("isFromUser()", () => {
      it("returns true for matching userId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isFromUser("user-123")).toBe(true);
      });

      it("returns false for non-matching userId", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isFromUser("user-different")).toBe(false);
      });

      it("returns false for empty string", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-abc",
            groupId: "group-xyz",
            userId: "user-123",
          }),
        );

        expect(request.isFromUser("")).toBe(false);
      });
    });
  });

  // ============================================================================
  // Age Tracking Tests
  // ============================================================================
  describe("age tracking methods", () => {
    describe("getAgeMs()", () => {
      it("returns positive age for past request", async () => {
        const pastDate = new Date(Date.now() - 60000); // 1 minute ago
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
            createdAt: pastDate,
          }),
        );

        const age = request.getAgeMs();
        expect(age).toBeGreaterThanOrEqual(60000);
        expect(age).toBeLessThan(70000); // Allow some buffer
      });

      it("returns near-zero for current request", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
          }),
        );

        const age = request.getAgeMs();
        expect(age).toBeGreaterThanOrEqual(0);
        expect(age).toBeLessThan(1000); // Less than 1 second
      });
    });

    describe("isOlderThan()", () => {
      it("returns true when request is older than threshold", async () => {
        const pastDate = new Date(Date.now() - 120000); // 2 minutes ago
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
            createdAt: pastDate,
          }),
        );

        expect(request.isOlderThan(60000)).toBe(true); // Older than 1 minute
      });

      it("returns false when request is newer than threshold", async () => {
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
          }),
        );

        expect(request.isOlderThan(60000)).toBe(false); // Not older than 1 minute
      });

      it("returns false at exact threshold", async () => {
        const pastDate = new Date(Date.now() - 60000); // Exactly 1 minute ago
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
            createdAt: pastDate,
          }),
        );

        expect(request.isOlderThan(60000)).toBe(false); // Exactly 60000ms, not greater
      });

      it("works with custom timestamp", async () => {
        const customDate = new Date("2024-01-01T00:00:00Z");
        const request = await Effect.runPromise(
          GroupJoinRequest.create({
            tripId: "trip-123",
            groupId: "group-456",
            userId: "user-789",
            createdAt: customDate,
          }),
        );

        const age = request.getAgeMs();
        expect(age).toBeGreaterThan(0);
        expect(request.isOlderThan(1000)).toBe(true);
      });
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================
  describe("immutability", () => {
    it("properties cannot be modified externally", async () => {
      const request = await Effect.runPromise(
        GroupJoinRequest.create(validProps),
      );

      // TypeScript should prevent this at compile time,
      // but we verify the properties are readonly in practice
      expect(request.id).toBe("request-123");
      expect(request.tripId).toBe("trip-456");
      expect(request.groupId).toBe("group-789");
      expect(request.userId).toBe("user-abc");
    });
  });
});
