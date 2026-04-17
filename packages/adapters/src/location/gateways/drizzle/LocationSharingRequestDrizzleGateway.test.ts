/**
 * LocationSharingRequestDrizzleGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryLocationSharingRequestGateway } from "../in-memory/InMemoryLocationSharingRequestGateway";
import {
  LocationSharingRequest,
  LocationSharingRequestId,
  UserId,
  TripId,
  DatabaseError,
} from "@mirai-app/domain";

const createTestRequest = (
  id: string,
  overrides?: Partial<LocationSharingRequest>,
): LocationSharingRequest => {
  return {
    id: LocationSharingRequestId.unsafeCreate(id),
    requesterId: UserId.unsafeCreate("requester-default"),
    targetId: UserId.unsafeCreate("target-default"),
    tripId: TripId.unsafeCreate("trip-default"),
    status: overrides?.status ?? "pending",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  } as LocationSharingRequest;
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
      const request = createTestRequest("request-123");
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
      const request = createTestRequest("pattern-request");
      const effect = gateway.create(request);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
