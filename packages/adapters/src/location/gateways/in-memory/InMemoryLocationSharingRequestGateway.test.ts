/**
 * InMemoryLocationSharingRequestGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryLocationSharingRequestGateway } from "./InMemoryLocationSharingRequestGateway";
import {
  LocationSharingRequest,
  LocationSharingRequestId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";

// Test data factory using LocationSharingRequest.create factory method
const createTestRequest = async (
  id: string,
  overrides?: Partial<{
    status: "PENDING" | "ACCEPTED" | "REJECTED";
  }>,
): Promise<LocationSharingRequest> => {
  const effect = LocationSharingRequest.create({
    id: LocationSharingRequestId.unsafeCreate(id),
    senderId: UserId.unsafeCreate("sender-default"),
    receiverId: UserId.unsafeCreate("receiver-default"),
    status: overrides?.status ?? "PENDING",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
  return await Effect.runPromise(effect);
};

describe("[UNIT] InMemoryLocationSharingRequestGateway", () => {
  let gateway: InMemoryLocationSharingRequestGateway;

  beforeEach(() => {
    gateway = new InMemoryLocationSharingRequestGateway();
  });

  describe("findById", () => {
    it("should return null when request not found", async () => {
      const effect = gateway.findById(
        LocationSharingRequestId.unsafeCreate("nonexistent"),
      );
      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) expect(either.right).toBeNull();
    });

    it("should return request when found", async () => {
      const request = await createTestRequest("request-123");
      await Effect.runPromise(gateway.create(request));

      const effect = gateway.findById(request.id);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either) && either.right) {
        expect(either.right.id).toEqual(request.id);
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for errors", async () => {
      const request = await createTestRequest("pattern-request");
      const effect = gateway.create(request);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
