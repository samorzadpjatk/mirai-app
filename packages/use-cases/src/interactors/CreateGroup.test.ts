import { describe, it, expect, beforeEach } from "bun:test";
import {
  createGroupUseCase,
  type CreateGroupInput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./CreateGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { InMemoryGroupRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createGroupUseCase (Effect)", () => {
  let repo: InMemoryGroupRepository;

  beforeEach(() => {
    repo = new InMemoryGroupRepository();
  });

  // Helper to create a valid group
  const createValidGroup = (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      code: string;
      organizerId: string;
    }>,
  ): Group => {
    const result = Group.create({
      id: overrides?.id ?? "group-123",
      tripId: overrides?.tripId ?? "trip-123",
      name: overrides?.name ?? "Test Group",
      code: overrides?.code ?? "TEST123",
      organizerId: overrides?.organizerId ?? "user-123",
      description: null,
      image: null,
      coins: 100,
      status: GroupStatus.ACTIVE,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test group: ${result.error.message}`);
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: CreateGroupInput) => {
    const program = createGroupUseCase(input).pipe(
      Effect.provideService(GroupRepositoryTag, {
        create: (group: Group) => Effect.promise(() => repo.create(group)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByStatus: (status: GroupStatus) =>
          Effect.promise(() => repo.findByStatus(status)),
        findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
          Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
        findByOrganizerId: (organizerId: string) =>
          Effect.promise(() => repo.findByOrganizerId(organizerId)),
        findByCode: (code: string) =>
          Effect.promise(() => repo.findByCode(code)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (group: Group) => Effect.promise(() => repo.update(group)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        countByTripId: (tripId: string) =>
          Effect.promise(() => repo.countByTripId(tripId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should create group with valid input", async () => {
      // Arrange
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        coins: 100,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.tripId).toBe("trip-123");
      expect(result.name).toBe("Test Group");
      expect(result.code).toBe("TEST123");
      expect(result.organizerId).toBe("user-123");
      expect(result.coins).toBe(100);
      expect(result.status).toBe("ACTIVE");

      // Verify group was actually stored
      const stored = await repo.findByCode("TEST123");
      expect(stored).not.toBeNull();
      expect(stored?.tripId).toBe("trip-123");
    });

    it("should use default values when optional fields not provided", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST456",
        organizerId: "user-123",
        // coins, description, image, status not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.coins).toBe(0);
      expect(result.status).toBe("ACTIVE");
      expect(result.description).toBeNull();
      expect(result.image).toBeNull();

      // Verify stored group has defaults
      const stored = await repo.findByCode("TEST456");
      expect(stored?.coins).toBe(0);
    });

    it("should fail when group code already exists", async () => {
      // Arrange - seed existing group
      const existingGroup = createValidGroup({ code: "EXISTING" });
      await repo.create(existingGroup);

      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "EXISTING",
        organizerId: "user-123",
      };

      // Act
      const program = createGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => Effect.promise(() => repo.create(group)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: GroupStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByOrganizerId: (organizerId: string) =>
            Effect.promise(() => repo.findByOrganizerId(organizerId)),
          findByCode: (code: string) =>
            Effect.promise(() => repo.findByCode(code)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (group: Group) => Effect.promise(() => repo.update(group)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GroupCodeAlreadyExistsError);
        expect(either.left.message).toContain("already exists");
      }

      // Verify create was not called again
      const groups = await repo.findAll();
      expect(groups).toHaveLength(1);
    });

    it("should fail when domain validation fails for empty name", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "", // Invalid empty name
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const program = createGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => Effect.promise(() => repo.create(group)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: GroupStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByOrganizerId: (organizerId: string) =>
            Effect.promise(() => repo.findByOrganizerId(organizerId)),
          findByCode: (code: string) =>
            Effect.promise(() => repo.findByCode(code)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (group: Group) => Effect.promise(() => repo.update(group)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GroupCreationError);
        expect(either.left.message).toContain("name");
      }

      // Verify no group was stored
      const stored = await repo.findByCode("TEST123");
      expect(stored).toBeNull();
    });

    it("should fail when domain validation fails for empty tripId", async () => {
      const input: CreateGroupInput = {
        tripId: "", // Empty tripId
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const program = createGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => Effect.promise(() => repo.create(group)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: GroupStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByOrganizerId: (organizerId: string) =>
            Effect.promise(() => repo.findByOrganizerId(organizerId)),
          findByCode: (code: string) =>
            Effect.promise(() => repo.findByCode(code)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (group: Group) => Effect.promise(() => repo.update(group)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GroupCreationError);
        expect(either.left.message).toContain("tripId");
      }

      // Verify no groups in repo
      const groups = await repo.findAll();
      expect(groups).toHaveLength(0);
    });

    it("should fail when domain validation fails for empty organizerId", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "", // Empty organizerId
      };

      // Act
      const program = createGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => Effect.promise(() => repo.create(group)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: GroupStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByOrganizerId: (organizerId: string) =>
            Effect.promise(() => repo.findByOrganizerId(organizerId)),
          findByCode: (code: string) =>
            Effect.promise(() => repo.findByCode(code)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (group: Group) => Effect.promise(() => repo.update(group)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GroupCreationError);
        expect(either.left.message).toContain("organizerId");
      }
    });

    it("should pass optional description and image to repository", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        description: "A test group description",
        image: "https://example.com/image.png",
        coins: 500,
        status: GroupStatus.ACTIVE,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBe("A test group description");
      expect(result.image).toBe("https://example.com/image.png");
      expect(result.coins).toBe(500);

      // Verify repository was called
      const stored = await repo.findByCode("TEST123");
      expect(stored).not.toBeNull();
      expect(stored?.description).toBe("A test group description");
    });
  });
});
