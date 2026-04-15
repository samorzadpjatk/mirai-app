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
import { InMemoryGroupGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] createGroupUseCase (Effect)", () => {
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
    }>,
  ): Group => {
    const effect = Group.create({
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
    return Effect.runSync(effect);
  };

  const runUseCase = async (input: CreateGroupInput) => {
    const program = createGroupUseCase(input).pipe(
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
    it("should create group with valid input", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        coins: 100,
      };

      const result = await runUseCase(input);

      expect(result.tripId).toBe("trip-123");
      expect(result.name).toBe("Test Group");
      expect(result.code).toBe("TEST123");
      expect(result.organizerId).toBe("user-123");
      expect(result.coins).toBe(100);
      expect(result.status).toBe("ACTIVE");

      const stored = await Effect.runPromise(repo.findByCode("TEST123"));
      expect(stored).not.toBeNull();
      expect(stored?.tripId).toBe("trip-123");
    });

    it("should use default values when optional fields not provided", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST456",
        organizerId: "user-123",
      };

      const result = await runUseCase(input);

      expect(result.coins).toBe(0);
      expect(result.status).toBe("ACTIVE");
      expect(result.description).toBeNull();
      expect(result.image).toBeNull();

      const stored = await Effect.runPromise(repo.findByCode("TEST456"));
      expect(stored?.coins).toBe(0);
    });

    it("should fail when group code already exists", async () => {
      const existingGroup = createValidGroup({ code: "EXISTING" });
      await Effect.runPromise(repo.create(existingGroup));

      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "EXISTING",
        organizerId: "user-123",
      };

      const program = createGroupUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GroupCodeAlreadyExistsError);
        expect(either.left.message).toContain("already exists");
      }

      const groups = await Effect.runPromise(repo.findAll());
      expect(groups).toHaveLength(1);
    });

    it("should fail when domain validation fails for empty name", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "",
        code: "TEST123",
        organizerId: "user-123",
      };

      const program = createGroupUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GroupCreationError);
        expect(either.left.message).toContain("name");
      }

      const stored = await Effect.runPromise(repo.findByCode("TEST123"));
      expect(stored).toBeNull();
    });

    it("should fail when domain validation fails for empty tripId", async () => {
      const input: CreateGroupInput = {
        tripId: "",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
      };

      const program = createGroupUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GroupCreationError);
        expect(either.left.message).toContain("tripId");
      }

      const groups = await Effect.runPromise(repo.findAll());
      expect(groups).toHaveLength(0);
    });

    it("should fail when domain validation fails for empty organizerId", async () => {
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "",
      };

      const program = createGroupUseCase(input).pipe(
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

      const result = await runUseCase(input);

      expect(result.description).toBe("A test group description");
      expect(result.image).toBe("https://example.com/image.png");
      expect(result.coins).toBe(500);

      const stored = await Effect.runPromise(repo.findByCode("TEST123"));
      expect(stored).not.toBeNull();
      expect(stored?.description).toBe("A test group description");
    });
  });
});
