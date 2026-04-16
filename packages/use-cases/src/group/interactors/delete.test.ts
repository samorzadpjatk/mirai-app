import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteGroupUseCase,
  type DeleteGroupInput,
  DeleteGroupNotFoundError,
} from "./delete";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupGatewayTag } from "../ports/gateway";
import { InMemoryGroupGateway } from "@mirai-app/adapters";

describe("[UNIT] deleteGroupUseCase (Effect)", () => {
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

  const runUseCase = async (input: DeleteGroupInput) => {
    const program = deleteGroupUseCase(input).pipe(
      Effect.provideService(GroupGatewayTag, {
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
    it("should delete group when found", async () => {
      const existingGroup = createValidGroup({ id: "group-to-delete" });
      await Effect.runPromise(repo.create(existingGroup));

      const input: DeleteGroupInput = {
        groupId: "group-to-delete",
      };

      const beforeDelete = await Effect.runPromise(
        repo.findById("group-to-delete"),
      );
      expect(beforeDelete).not.toBeNull();

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.deletedGroupId).toBe("group-to-delete");

      const afterDelete = await Effect.runPromise(
        repo.findById("group-to-delete"),
      );
      expect(afterDelete).toBeNull();
    });

    it("should fail when group not found", async () => {
      const input: DeleteGroupInput = {
        groupId: "non-existent-id",
      };

      const program = deleteGroupUseCase(input).pipe(
        Effect.provideService(GroupGatewayTag, {
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
        expect(either.left).toBeInstanceOf(DeleteGroupNotFoundError);
      }
    });

    it("should not affect other groups when deleting one", async () => {
      const group1 = createValidGroup({ id: "user-1", code: "CODE1" });
      const group2 = createValidGroup({ id: "user-2", code: "CODE2" });
      const group3 = createValidGroup({ id: "user-3", code: "CODE3" });

      await Effect.runPromise(repo.create(group1));
      await Effect.runPromise(repo.create(group2));
      await Effect.runPromise(repo.create(group3));

      const input: DeleteGroupInput = {
        groupId: "user-2",
      };

      await runUseCase(input);

      const allGroups = await Effect.runPromise(repo.findAll());
      expect(allGroups).toHaveLength(2);
      expect(allGroups.find((g) => g.id === "user-1")).not.toBeNull();
      expect(allGroups.find((g) => g.id === "user-2")).toBeUndefined();
      expect(allGroups.find((g) => g.id === "user-3")).not.toBeNull();
    });
  });
});
