import { describe, it, expect, beforeEach } from "bun:test";
import {
  removeSharingUserUseCase,
  type RemoveSharingUserInput,
} from "./remove-user";
import { Effect, Either } from "effect";
import { LocationGatewayTag } from "../.././ports/location/gateway";
import type { Location, LocationId } from "@mirai-app/domain";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location =>
  ({
    id: "loc-123" as LocationId,
    userId: "user-123",
    usersToShareWith: [
      { id: "user-1", firstName: "John", lastName: "Doe" },
      { id: "user-2", firstName: "Jane", lastName: "Smith" },
    ],
    isSharingLocation: () => true,
    removeSharingUser: function (userId: string) {
      return {
        ...this,
        usersToShareWith: this.usersToShareWith.filter(
          (u: { id: string }) => u.id !== userId,
        ),
      };
    },
    ...overrides,
  }) as unknown as Location;

// Create mock repository service
const createMockRepoService = (overrides?: {
  findByUserId?: (userId: string) => Promise<Location | null>;
  save?: (location: Location) => Promise<Location>;
}) => ({
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findByUserId: (userId: string) =>
    Effect.promise(() =>
      overrides?.findByUserId
        ? overrides.findByUserId(userId)
        : Promise.resolve(null),
    ),
  findAll: () => Effect.promise(() => Promise.resolve([])),
  findSharingWithUser: () => Effect.promise(() => Promise.resolve([])),
  findByUserIds: () => Effect.promise(() => Promise.resolve([])),
  save: (location: Location) =>
    Effect.promise(() =>
      overrides?.save ? overrides.save(location) : Promise.resolve(location),
    ),
  create: (location: Location) =>
    Effect.promise(() => Promise.resolve(location)),
  delete: () => Effect.promise(() => Promise.resolve()),
  deleteByUserId: () => Effect.promise(() => Promise.resolve()),
  existsForUser: () => Effect.promise(() => Promise.resolve(false)),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: RemoveSharingUserInput,
  repoOverrides?: {
    findByUserId?: (userId: string) => Promise<Location | null>;
    save?: (location: Location) => Promise<Location>;
  },
) => {
  const program = removeSharingUserUseCase(input).pipe(
    Effect.provideService(
      LocationGatewayTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] removeSharingUserUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should remove user from sharing list", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(createMockLocation()),
      });

      expect(result.usersToShareWith).toHaveLength(1);
      expect(result.usersToShareWith[0].id).toBe("user-2");
    });

    it("should handle removing non-existent user gracefully", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "nonexistent-user",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(createMockLocation()),
      });

      // Should still have both users since nonexistent wasn't found
      expect(result.usersToShareWith).toHaveLength(2);
    });

    it("should keep location ID and userId in output", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(createMockLocation()),
      });

      expect(result.id).toBe("loc-123");
      expect(result.userId).toBe("user-123");
    });

    it("should maintain isSharingLocation status", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(createMockLocation()),
      });

      expect(result.isSharingLocation).toBe(true);
    });
  });
});
