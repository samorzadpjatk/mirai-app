import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  RemoveSharingUserUseCase,
  type RemoveSharingUserInput,
} from "./RemoveSharingUser";
import type { LocationRepository } from "../ports/LocationRepository";
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

describe("[UNIT] RemoveSharingUserUseCase", () => {
  let useCase: RemoveSharingUserUseCase;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findByUserId: mock(() => Promise.resolve(createMockLocation())),
      save: mock((loc: Location) => Promise.resolve(loc)),
    } as unknown as LocationRepository;

    useCase = new RemoveSharingUserUseCase(mockLocationRepository);
  });

  describe("execute", () => {
    it("should remove user from sharing list", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toHaveLength(1);
        expect(result.value.usersToShareWith[0].id).toBe("user-2");
      }
    });

    it("should return error when location not found", async () => {
      mockLocationRepository.findByUserId = mock(() => Promise.resolve(null));

      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Location not found");
      }
    });

    it("should persist changes to repository", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      await useCase.execute(input);

      expect(mockLocationRepository.save).toHaveBeenCalled();
    });

    it("should call findByUserId with ownerUserId", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-456",
        userToRemoveId: "user-1",
      };

      await useCase.execute(input);

      expect(mockLocationRepository.findByUserId).toHaveBeenCalledWith(
        "user-456",
      );
    });

    it("should handle removing non-existent user gracefully", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "nonexistent-user",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        // Should still have both users since nonexistent wasn't found
        expect(result.value.usersToShareWith).toHaveLength(2);
      }
    });

    it("should keep location ID and userId in output", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("loc-123");
        expect(result.value.userId).toBe("user-123");
      }
    });

    it("should maintain isSharingLocation status", async () => {
      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should remove all matching users if multiple (edge case)", async () => {
      const locationWithDuplicates = createMockLocation({
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-1", firstName: "John", lastName: "Doe" }, // duplicate
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ],
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(locationWithDuplicates),
      );

      const input: RemoveSharingUserInput = {
        ownerUserId: "user-123",
        userToRemoveId: "user-1",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        // Should remove all instances of user-1
        expect(result.value.usersToShareWith).toHaveLength(1);
        expect(result.value.usersToShareWith[0].id).toBe("user-2");
      }
    });
  });
});
