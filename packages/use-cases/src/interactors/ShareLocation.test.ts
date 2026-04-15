import { describe, it, expect, beforeEach } from "bun:test";
import {
  shareLocationUseCase,
  type ShareLocationInput,
  ShareLocationNotFoundError,
  ShareLocationValidationError,
  ShareLocationSelfShareError,
} from "./ShareLocation";
import { Location } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { InMemoryLocationGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] shareLocationUseCase (Effect)", () => {
  let repo: InMemoryLocationGateway;

  beforeEach(() => {
    repo = new InMemoryLocationGateway();
  });

  // Helper to create a valid location
  const createValidLocation = (
    overrides?: Partial<{
      id: string;
      userId: string;
      isSharingLocation: boolean;
    }>,
  ): Location => {
    const effect = Location.create({
      id: overrides?.id ?? "loc-123",
      userId: overrides?.userId ?? "user-123",
      latitude: 52.52,
      longitude: 13.405,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      isSharingLocation: overrides?.isSharingLocation ?? false,
      usersToShareWith: [],
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test location: ${e}`);
    }
  };

  // Helper to run use case with repository
  const runUseCase = async (input: ShareLocationInput) => {
    const program = shareLocationUseCase(input).pipe(
      Effect.provideService(LocationRepositoryTag, {
        create: (location: Location) => repo.create(location),
        findById: (id: string) => repo.findById(id),
        findByUserId: (userId: string) => repo.findByUserId(userId),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        findSharingWithUser: (userId: string) =>
          repo.findSharingWithUser(userId),
        findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
        save: (location: Location) => repo.save(location),
        delete: (id: string) => repo.delete(id),
        deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
        existsForUser: (userId: string) => repo.existsForUser(userId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should share location with target user", async () => {
      // Arrange - seed existing location with sharing disabled
      const existingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: false,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: ShareLocationInput = {
        userId: "user-123",
        targetUserId: "target-user",
        targetUserFirstName: "John",
        targetUserLastName: "Doe",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(1);
      expect(result.usersToShareWith[0].id).toBe("target-user");
      expect(result.usersToShareWith[0].firstName).toBe("John");
      expect(result.usersToShareWith[0].lastName).toBe("Doe");

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.isSharingLocation()).toBe(true);
      expect(stored?.usersToShareWith).toHaveLength(1);
    });

    it("should fail when trying to share with self", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({
        userId: "user-123",
      });
      Effect.runSync(repo.create(existingLocation));

      const input: ShareLocationInput = {
        userId: "user-123",
        targetUserId: "user-123", // Same as userId
        targetUserFirstName: "John",
        targetUserLastName: "Doe",
      };

      // Act
      const program = shareLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ShareLocationSelfShareError);
      }
    });

    it("should fail when location not found for user", async () => {
      // Arrange - no location in repo
      const input: ShareLocationInput = {
        userId: "user-without-location",
        targetUserId: "target-user",
        targetUserFirstName: "John",
        targetUserLastName: "Doe",
      };

      // Act
      const program = shareLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ShareLocationNotFoundError);
      }
    });

    it("should fail when already sharing with target user", async () => {
      // Arrange - seed location already sharing with one user
      const locationWithSharing = createValidLocation({
        userId: "user-123",
        isSharingLocation: true,
      });
      // Add first user to sharing list via Effect
      const addUserEffect = locationWithSharing.addSharingUser({
        id: "target-user",
        firstName: "John",
        lastName: "Doe",
      });
      const loc = Effect.runSync(addUserEffect);
      Effect.runSync(repo.create(loc));

      const input: ShareLocationInput = {
        userId: "user-123",
        targetUserId: "target-user", // Already sharing with this user
        targetUserFirstName: "John",
        targetUserLastName: "Doe",
      };

      // Act
      const program = shareLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(ShareLocationValidationError);
        expect(either.left.message).toContain("Already sharing");
      }
    });

    it("should share location with multiple users", async () => {
      // Arrange - seed location already sharing with one user
      const locationWithSharing = createValidLocation({
        userId: "user-123",
        isSharingLocation: true,
      });
      // Add first user to sharing list via Effect
      const addUserEffect = locationWithSharing.addSharingUser({
        id: "user-1",
        firstName: "First",
        lastName: "User",
      });
      const loc = Effect.runSync(addUserEffect);
      Effect.runSync(repo.create(loc));

      const input: ShareLocationInput = {
        userId: "user-123",
        targetUserId: "user-2", // Different user
        targetUserFirstName: "Second",
        targetUserLastName: "User",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.usersToShareWith).toHaveLength(2);
      expect(result.usersToShareWith.some((u) => u.id === "user-1")).toBe(true);
      expect(result.usersToShareWith.some((u) => u.id === "user-2")).toBe(true);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.usersToShareWith).toHaveLength(2);
    });
  });
});
