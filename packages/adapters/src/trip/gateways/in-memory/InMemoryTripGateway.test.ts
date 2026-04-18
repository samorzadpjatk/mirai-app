/**
 * InMemoryTripGateway Tests
 *
 * Tests for the in-memory implementation of ITripPort.
 * Uses AuthContext pattern with Effect.gen and Layer.provide for auth dependencies.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either, Layer } from "effect";
import { InMemoryTripGateway } from "../in-memory/InMemoryTripGateway";
import { Trip, TripId, type ValidationError, DatabaseError } from "@mirai-app/domain";
import { AuthContextTag, type AuthContext } from "../../../infrastructure/effect";
import { AuthZPortTag } from "@mirai-app/use-cases";
import type { IAuthZPort } from "@mirai-app/domain";

// ============================================================================
// Mock AuthContext Helper
// ============================================================================

/**
 * Creates a mock AuthContext for testing
 */
const createMockAuthContext = (overrides?: Partial<AuthContext>): AuthContext => ({
  userId: overrides?.userId ?? "user-test",
  role: overrides?.role ?? "USER",
  tripRoles: overrides?.tripRoles ?? {},
  isAuthenticated: overrides?.isAuthenticated ?? true,
  accessToken: overrides?.accessToken ?? "mock-access-token",
});

/**
 * Creates a mock IAuthZPort that always allows access
 */
const createMockAuthZPort = (): IAuthZPort => ({
  verifyAccess: () => Effect.succeed(void 0),
  checkRolePermission: () => Effect.succeed(true),
});

/**
 * Creates a test layer with mocked AuthContext and AuthZPort
 */
const getTestLayer = (authContext?: AuthContext) =>
  Layer.mergeAll(
    Layer.succeed(AuthContextTag, authContext ?? createMockAuthContext()),
    Layer.succeed(AuthZPortTag, createMockAuthZPort()),
  );

// Test data factory - returns Effect that creates a Trip
const createTestTrip = (
  id: string,
  overrides?: Partial<{
    name: string;
    description: string | null;
    backgroundImagePath: string | null;
  }>,
): Effect.Effect<Trip, ValidationError, never> => {
  return Trip.create({
    id: TripId.unsafeCreate(id),
    name: overrides?.name ?? "Test Trip",
    description: overrides?.description ?? "A test trip",
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-07"),
    backgroundImagePath: overrides?.backgroundImagePath ?? null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
};

describe("[UNIT] InMemoryTripGateway", () => {
  let gateway: InMemoryTripGateway;

  beforeEach(() => {
    gateway = new InMemoryTripGateway();
  });

  describe("findById", () => {
    it("should return null when trip not found", async () => {
      const tripId = TripId.unsafeCreate("nonexistent-id");
      const effect = gateway.findById(tripId).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result).toBeNull();
    });

    it("should return trip when found", async () => {
      const trip = await Effect.runPromise(createTestTrip("trip-123"));
      await Effect.runPromise(gateway.create(trip).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.findById(trip.id).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(trip.id);
      expect(result?.name).toBe("Test Trip");
    });
  });

  describe("findByUserId", () => {
    it("should return trips by user", async () => {
      const userId = "user-abc";
      const trip1 = await Effect.runPromise(createTestTrip("t1"));
      const trip2 = await Effect.runPromise(createTestTrip("t2"));

      await Effect.runPromise(gateway.create(trip1).pipe(Effect.provide(getTestLayer())));
      await Effect.runPromise(gateway.create(trip2).pipe(Effect.provide(getTestLayer())));
      gateway.addParticipant(TripId.toString(trip1.id), userId);
      gateway.addParticipant(TripId.toString(trip2.id), userId);

      const effect = gateway.findByUserId(userId).pipe(Effect.provide(getTestLayer()));
      const result = await Effect.runPromise(effect);

      expect(result).toHaveLength(2);
    });
  });

  describe("create", () => {
    it("should create and return trip", async () => {
      const trip = await Effect.runPromise(createTestTrip("new-trip"));
      const effect = gateway.create(trip).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(trip.id);
    });
  });

  describe("update", () => {
    it("should update existing trip", async () => {
      const trip = await Effect.runPromise(createTestTrip("update-trip", { name: "Original" }));
      await Effect.runPromise(gateway.create(trip).pipe(Effect.provide(getTestLayer())));

      const updatedEffect = trip.withDetails({ name: "Updated" });
      const updated = await Effect.runPromise(updatedEffect);
      const effect = gateway.update(updated).pipe(Effect.provide(getTestLayer()));

      const result = await Effect.runPromise(effect);
      expect(result.name).toBe("Updated");
    });
  });

  describe("delete", () => {
    it("should delete trip", async () => {
      const trip = await Effect.runPromise(createTestTrip("delete-trip"));
      await Effect.runPromise(gateway.create(trip).pipe(Effect.provide(getTestLayer())));

      const effect = gateway.delete(trip.id).pipe(Effect.provide(getTestLayer()));
      await Effect.runPromise(effect);

      const found = await Effect.runPromise(gateway.findById(trip.id).pipe(Effect.provide(getTestLayer())));
      expect(found).toBeNull();
    });
  });

  describe("AuthContext pattern", () => {
    it("should use AuthContext with Layer.provide", async () => {
      // Create a custom auth context for testing with trip-specific roles
      const customAuthContext = createMockAuthContext({
        userId: "custom-user",
        role: "USER",
        tripRoles: { "trip-123": "LEADER" },
      });
      const customLayer = getTestLayer(customAuthContext);

      const trip = await Effect.runPromise(createTestTrip("auth-test-trip"));
      const effect = gateway.create(trip).pipe(Effect.provide(customLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(trip.id);
    });

    it("should work with unauthenticated context for public operations", async () => {
      const unauthenticatedContext = createMockAuthContext({
        userId: "",
        role: "USER",
        isAuthenticated: false,
      });
      const publicLayer = getTestLayer(unauthenticatedContext);

      const trip = await Effect.runPromise(createTestTrip("public-test-trip"));
      const effect = gateway.create(trip).pipe(Effect.provide(publicLayer));

      const result = await Effect.runPromise(effect);
      expect(result.id).toEqual(trip.id);
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with instanceof for errors", async () => {
      const trip = await Effect.runPromise(createTestTrip("pattern-trip"));
      const effect = gateway.create(trip).pipe(Effect.provide(getTestLayer()));

      const either = await Effect.runPromise(Effect.either(effect));
      expect(Either.isRight(either)).toBe(true);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
