import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateGroupUseCase,
  type UpdateGroupInput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./UpdateGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { InMemoryGroupGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] updateGroupUseCase (Effect)", () => {
  let repo: InMemoryGroupGateway;

  beforeEach(() => {
    repo = new InMemoryGroupGateway();
  });

  const createValidGroup = (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      code: string;
      organizerId: string;
      coins: number;
      status: GroupStatus;
    }>,
  ): Group => {
    const effect = Group.create({
      id: overrides?.id ?? "group-123",
      tripId: overrides?.tripId ?? "trip-123",
      name: overrides?.name ?? "Test Group",
      code: overrides?.code ?? "TEST123",
      organizerId: overrides?.organizerId ?? "user-123",
      description: "A test description",
      image: "https://example.com/image.png",
      coins: overrides?.coins ?? 100,
      status: overrides?.status ?? GroupStatus.ACTIVE,
    });
    return Effect.runSync(effect);
  };

  const runUseCase = async (input: UpdateGroupInput) => {
    const program = updateGroupUseCase(input).pipe(
      Effect.provideService(GroupRepositoryTag, {
        create: (group: Group) => repo.create(group),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByStatus: (status: GroupStatus) => repo.findByStatus(status),
        findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
          repo.findByTripIdAndStatus(tripId, status),
        findByOrganizerId: (organizerId: string) =>
          repo.findByOrganizerId(organizerId),
        findByCode: (code: string) => repo.findByCode(code),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        update: (group: Group) => repo.update(group),
        delete: (id: string) => repo.delete(id),
        exists: (id: string) => repo.exists(id),
        countByTripId: (tripId: string) => repo.countByTripId(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should update group name successfully", async () => {
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Old Name",
      });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "New Name",
      };

      const result = await runUseCase(input);

      expect(result.name).toBe("New Name");
      expect(result.id).toBe("group-456");

      const stored = await Effect.runPromise(repo.findById("group-456"));
      expect(stored?.name).toBe("New Name");
    });

    it("should update group description and image", async () => {
      const existingGroup = createValidGroup({ id: "group-456" });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
        description: "Updated description",
        image: "https://example.com/new-image.png",
      };

      const result = await runUseCase(input);

      expect(result.description).toBe("Updated description");
      expect(result.image).toBe("https://example.com/new-image.png");
    });

    it("should update organizerId successfully", async () => {
      const existingGroup = createValidGroup({
        id: "group-456",
        organizerId: "user-old",
      });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
        organizerId: "user-new",
      };

      const result = await runUseCase(input);

      expect(result.organizerId).toBe("user-new");

      const stored = await Effect.runPromise(repo.findById("group-456"));
      expect(stored?.organizerId).toBe("user-new");
    });

    it("should fail when group not found", async () => {
      const input: UpdateGroupInput = {
        groupId: "non-existent-id",
        name: "New Name",
      };

      const program = updateGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => repo.create(group),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: GroupStatus) => repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByOrganizerId: (organizerId: string) =>
            repo.findByOrganizerId(organizerId),
          findByCode: (code: string) => repo.findByCode(code),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (group: Group) => repo.update(group),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByTripId: (tripId: string) => repo.countByTripId(tripId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupNotFoundError);
      }
    });

    it("should fail when group is deleted", async () => {
      const deletedGroup = Effect.runSync(
        Group.create({
          id: "group-deleted",
          tripId: "trip-123",
          name: "Deleted Group",
          code: "DELETED",
          organizerId: "user-123",
          description: null,
          image: null,
          coins: 0,
          status: GroupStatus.DELETED,
        }),
      );
      await Effect.runPromise(repo.create(deletedGroup));

      const input: UpdateGroupInput = {
        groupId: "group-deleted",
        name: "New Name",
      };

      const program = updateGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => repo.create(group),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: GroupStatus) => repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByOrganizerId: (organizerId: string) =>
            repo.findByOrganizerId(organizerId),
          findByCode: (code: string) => repo.findByCode(code),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (group: Group) => repo.update(group),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByTripId: (tripId: string) => repo.countByTripId(tripId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupDeletedError);
      }
    });

    it("should fail when name validation fails", async () => {
      const existingGroup = createValidGroup({ id: "group-456" });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "",
      };

      const program = updateGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => repo.create(group),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: GroupStatus) => repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByOrganizerId: (organizerId: string) =>
            repo.findByOrganizerId(organizerId),
          findByCode: (code: string) => repo.findByCode(code),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (group: Group) => repo.update(group),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByTripId: (tripId: string) => repo.countByTripId(tripId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupValidationError);
        expect(either.left.message).toContain("name");
      }
    });

    it("should not update when no fields provided", async () => {
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Original Name",
      });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
      };

      const result = await runUseCase(input);

      expect(result.name).toBe("Original Name");
    });

    it("should include isActive and summary in output", async () => {
      const existingGroup = createValidGroup({ id: "group-456" });
      await Effect.runPromise(repo.create(existingGroup));

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "Updated Name",
      };

      const result = await runUseCase(input);

      expect(result.isActive).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
