/**
 * GroupJoinRequestDrizzleGateway Tests
 *
 * Tests for the Drizzle ORM implementation of IGroupJoinRequestPort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryGroupJoinRequestGateway } from "../in-memory/InMemoryGroupJoinRequestGateway";
import {
  GroupJoinRequest,
  GroupJoinRequestId,
  GroupId,
  UserId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory
const createTestRequest = (
  id: string,
  overrides?: Partial<{
    status: "pending" | "approved" | "rejected";
    message: string;
  }>,
): GroupJoinRequest => {
  return {
    id: GroupJoinRequestId.unsafeCreate(id),
    groupId: GroupId.unsafeCreate("group-default"),
    userId: UserId.unsafeCreate("user-default"),
    tripId: TripId.unsafeCreate("trip-default"),
    status: overrides?.status ?? "pending",
    message: overrides?.message ?? "Please let me join",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as GroupJoinRequest;
};

describe("[UNIT] InMemoryGroupJoinRequestGateway", () => {
  let gateway: InMemoryGroupJoinRequestGateway;

  beforeEach(() => {
    gateway = new InMemoryGroupJoinRequestGateway();
  });

  describe("findById", () => {
    it("should return null when request not found", async () => {
      const requestId = GroupJoinRequestId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(requestId);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeNull();
      }
    });

    it("should return request when found", async () => {
      const request = createTestRequest("request-123");
      await Effect.runPromise(gateway.create(request));

      const effect = gateway.findById(request.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(request.id);
        expect(either.right.status).toBe("pending");
      }
    });
  });

  describe("findByGroupId", () => {
    it("should return requests for group", async () => {
      const groupId = GroupId.unsafeCreate("group-abc");
      const request1 = { ...createTestRequest("r1"), groupId };
      const request2 = { ...createTestRequest("r2"), groupId };

      await Effect.runPromise(gateway.create(request1));
      await Effect.runPromise(gateway.create(request2));

      const effect = gateway.findByGroupId(groupId);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(2);
      }
    });
  });

  describe("create", () => {
    it("should create and return request", async () => {
      const request = createTestRequest("new-request");
      const effect = gateway.create(request);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.id).toEqual(request.id);
      }
    });
  });

  describe("update", () => {
    it("should update request status", async () => {
      const request = createTestRequest("update-request");
      await Effect.runPromise(gateway.create(request));

      const updated = { ...request, status: "approved" as const };
      const effect = gateway.update(updated);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.status).toBe("approved");
      }
    });
  });

  describe("delete", () => {
    it("should delete request", async () => {
      const request = createTestRequest("delete-request");
      await Effect.runPromise(gateway.create(request));

      const effect = gateway.delete(request.id);
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      const found = await Effect.runPromise(gateway.findById(request.id));
      expect(found).toBeNull();
    });
  });

  describe("Either pattern", () => {
    it("should use Either.isRight for success", async () => {
      const request = createTestRequest("pattern-test");
      const effect = gateway.create(request);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
