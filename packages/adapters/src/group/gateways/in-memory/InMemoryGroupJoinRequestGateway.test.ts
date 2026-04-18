/**
 * InMemoryGroupJoinRequestGateway Tests
 *
 * Tests for the in-memory implementation of IGroupJoinRequestPort.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryGroupJoinRequestGateway } from "./InMemoryGroupJoinRequestGateway";
import {
  GroupJoinRequest,
  GroupJoinRequestId,
  GroupId,
  UserId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory using GroupJoinRequest.create factory method
const createTestRequest = async (
  id: string,
  overrides?: Partial<{
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    groupId?: GroupId;
  }>,
): Promise<GroupJoinRequest> => {
  const status = overrides?.status ?? "PENDING";
  const effect = GroupJoinRequest.create({
    id: GroupJoinRequestId.unsafeCreate(id),
    groupId: overrides?.groupId ?? GroupId.unsafeCreate("group-default"),
    tripId: TripId.unsafeCreate("trip-default"),
    userId: UserId.unsafeCreate("user-default"),
    status,
    requestedAt: new Date("2024-01-01"),
    decidedAt: status !== "PENDING" ? new Date("2024-01-02") : null,
    decidedBy: status !== "PENDING" ? UserId.unsafeCreate("decider-default") : null,
  });
  return await Effect.runPromise(effect);
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
      const request = await createTestRequest("request-123");
      await Effect.runPromise(gateway.create(request));

      const effect = gateway.findById(request.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(request.id);
        expect(either.right.status).toBe("PENDING");
      }
    });
  });

  describe("findByGroupId", () => {
    it("should return requests for group", async () => {
      const groupId = GroupId.unsafeCreate("group-abc");
      const request1 = await createTestRequest("r1", { groupId });
      const request2 = await createTestRequest("r2", { groupId });

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
      const request = await createTestRequest("new-request");
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
      const request = await createTestRequest("update-request");
      await Effect.runPromise(gateway.create(request));

      // Create updated request using factory method
      const updated = await createTestRequest("update-request", { status: "ACCEPTED" });
      const effect = gateway.update(updated);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.status).toBe("ACCEPTED");
      }
    });
  });

  describe("delete", () => {
    it("should delete request", async () => {
      const request = await createTestRequest("delete-request");
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
      const request = await createTestRequest("pattern-test");
      const effect = gateway.create(request);

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
