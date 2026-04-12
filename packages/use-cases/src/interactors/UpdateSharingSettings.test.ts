import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
} from "./UpdateSharingSettings";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location, LocationId } from "@mirai-app/domain";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location =>
  ({
    id: "loc-123" as LocationId,
    userId: "user-123",
    usersToShareWith: [],
    timestamp: new Date("2024-01-01"),
    isSharingLocation: () => false,
    startSharing: function () {
      return { ...this, isSharingLocation: () => true } as Location;
    },
    stopSharing: function () {
      return { ...this, isSharingLocation: () => false } as Location;
    },
    updateSharingUsers: function (users: unknown[]) {
      return { kind: "ok", value: { ...this, usersToShareWith: users } };
    },
    ...overrides,
  }) as unknown as Location;

// Create mock repository service
const createMockRepoService = (overrides?: {
  findByUserId?: (userId: string) => Promise<Location | null>;
  save?: (location: Location) => Promise<Location>;
  create?: (location: Location) => Promise<Location>;
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
    Effect.promise(() =>
      overrides?.create
        ? overrides.create(location)
        : Promise.resolve(location),
    ),
  delete: () => Effect.promise(() => Promise.resolve()),
  deleteByUserId: () => Effect.promise(() => Promise.resolve()),
  existsForUser: () => Effect.promise(() => Promise.resolve(false)),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: UpdateSharingSettingsInput,
  repoOverrides?: {
    findByUserId?: (userId: string) => Promise<Location | null>;
    save?: (location: Location) => Promise<Location>;
  },
) => {
  const program = updateSharingSettingsUseCase(input).pipe(
    Effect.provideService(
      LocationRepositoryTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] updateSharingSettingsUseCase (Effect)", () => {
  describe("execute", () => {
    it("should create new location when none exists with sharing enabled", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
        ],
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      expect(result.userId).toBe("user-123");
      expect(result.isSharingLocation).toBe(true);
      expect(result.usersToShareWith).toHaveLength(1);
    });

    it("should create new location when none exists with sharing disabled", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: false,
        usersToShareWith: [],
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      expect(result.isSharingLocation).toBe(false);
      expect(result.usersToShareWith).toEqual([]);
    });

    it("should update existing location to enable sharing", async () => {
      const existingLocation = createMockLocation({
        isSharingLocation: () => false,
        startSharing: function () {
          return { ...this, isSharingLocation: () => true } as Location;
        },
      });

      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(existingLocation),
      });

      expect(result.isSharingLocation).toBe(true);
    });

    it("should update existing location to disable sharing", async () => {
      const existingLocation = createMockLocation({
        isSharingLocation: () => true,
        stopSharing: function () {
          return { ...this, isSharingLocation: () => false } as Location;
        },
      });

      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: false,
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(existingLocation),
      });

      expect(result.isSharingLocation).toBe(false);
    });

    it("should include timestamp in output", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
});
