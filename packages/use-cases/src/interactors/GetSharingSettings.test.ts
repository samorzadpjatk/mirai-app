import { describe, it, expect, beforeEach } from "bun:test";
import {
  getSharingSettingsUseCase,
  type GetSharingSettingsInput,
} from "./GetSharingSettings";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
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
    ...overrides,
  }) as Location;

// Create mock repository service
const createMockRepoService = (overrides?: {
  findByUserId?: (userId: string) => Promise<Location | null>;
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
  save: (_loc: Location) =>
    Effect.promise(() => Promise.resolve({} as Location)),
  create: (_loc: Location) =>
    Effect.promise(() => Promise.resolve({} as Location)),
  delete: () => Effect.promise(() => Promise.resolve()),
  deleteByUserId: () => Effect.promise(() => Promise.resolve()),
  existsForUser: () => Effect.promise(() => Promise.resolve(false)),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: GetSharingSettingsInput,
  repoOverrides?: {
    findByUserId?: (userId: string) => Promise<Location | null>;
  },
) => {
  const program = getSharingSettingsUseCase(input).pipe(
    Effect.provideService(
      LocationRepositoryTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] getSharingSettingsUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should return default settings when no location exists", async () => {
      const input: GetSharingSettingsInput = { userId: "user-123" };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toEqual([]);
    });

    it("should return sharing settings when location exists", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ],
      });

      const result = await runUseCase(
        { userId: "user-123" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(2);
      expect(result.usersToShareWith[0]).toEqual({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should handle location with sharing disabled", async () => {
      const mockLocation = createMockLocation({
        isSharingLocation: () => false,
        usersToShareWith: [],
      });

      const result = await runUseCase(
        { userId: "user-123" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toEqual([]);
    });

    it("should handle location with users sharing with null names", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [{ id: "user-1", firstName: null, lastName: null }],
      });

      const result = await runUseCase(
        { userId: "user-123" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      expect(result.usersToShareWith[0].firstName).toBeNull();
      expect(result.usersToShareWith[0].lastName).toBeNull();
    });

    it("should handle location with empty usersToShareWith", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [],
      });

      const result = await runUseCase(
        { userId: "user-123" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      expect(result.usersToShareWith).toEqual([]);
    });
  });
});
