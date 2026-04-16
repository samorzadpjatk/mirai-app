import { describe, it, expect, beforeEach } from "bun:test";
import {
  addSharingUserUseCase,
  type AddSharingUserInput,
} from "./add-user";
import { Effect, Either } from "effect";
import { LocationGatewayTag } from "../.././ports/location/gateway";
import type { Location, LocationId, SharingUserInfo } from "@mirai-app/domain";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location => {
  const baseUsersToShareWith: SharingUserInfo[] = [];
  const mockLoc = {
    id: "loc-123" as LocationId,
    userId: "user-123",
    usersToShareWith: baseUsersToShareWith,
    isSharingLocation: () => true,
    addSharingUser: function (user: SharingUserInfo) {
      return Effect.succeed({
        ...this,
        usersToShareWith: [...(this.usersToShareWith ?? []), user],
      } as Location);
    },
    ...overrides,
  };
  return mockLoc as unknown as Location;
};

// Create mock repository service
const createMockRepoService = (overrides?: {
  findByUserId?: (userId: string) => Promise<Location | null>;
  create?: (location: Location) => Promise<Location>;
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
  input: AddSharingUserInput,
  repoOverrides?: {
    findByUserId?: (userId: string) => Promise<Location | null>;
    create?: (location: Location) => Promise<Location>;
    save?: (location: Location) => Promise<Location>;
  },
) => {
  const program = addSharingUserUseCase(input).pipe(
    Effect.provideService(
      LocationGatewayTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] addSharingUserUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should create new location when none exists and add user", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      expect(result.userId).toBe("user-123");
      expect(result.isSharingLocation).toBe(true);
      const resultUsers = result.usersToShareWith ?? [];
      expect(resultUsers).toHaveLength(1);
      expect(resultUsers[0]).toEqual({
        id: "user-456",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should add user to existing location", async () => {
      const existingUsers: SharingUserInfo[] = [
        { id: "user-1", firstName: "Alice", lastName: "Smith" },
      ];
      const existingLocation = createMockLocation({
        usersToShareWith: existingUsers,
        addSharingUser: function (user: SharingUserInfo) {
          const currentUsers = this.usersToShareWith ?? [];
          return Effect.succeed({
            ...this,
            usersToShareWith: [...currentUsers, user],
          } as Location);
        },
      });

      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(existingLocation),
      });

      const resultUsers = result.usersToShareWith ?? [];
      expect(resultUsers).toHaveLength(2);
      expect(resultUsers[1]?.id).toBe("user-456");
    });

    it("should handle null first and last names", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: null,
        userLastName: null,
      };

      const result = await runUseCase(input, {
        findByUserId: () => Promise.resolve(null),
      });

      const resultUsers = result.usersToShareWith ?? [];
      expect(resultUsers[0]?.firstName).toBeNull();
      expect(resultUsers[0]?.lastName).toBeNull();
    });
  });
});
