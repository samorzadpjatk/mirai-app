import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  AddSharingUserUseCase,
  type AddSharingUserInput,
} from "./AddSharingUser";
import type { LocationRepository } from "../ports/LocationRepository";
import type { Location, LocationId } from "@mirai-app/domain";

// Mock Location domain object
const createMockLocation = (overrides?: Partial<Location>): Location =>
  ({
    id: "loc-123" as LocationId,
    userId: "user-123",
    usersToShareWith: [],
    isSharingLocation: () => true,
    addSharingUser: function (user: unknown) {
      return {
        kind: "ok",
        value: { ...this, usersToShareWith: [...this.usersToShareWith, user] },
      };
    },
    ...overrides,
  }) as unknown as Location;

describe("[UNIT] AddSharingUserUseCase", () => {
  let useCase: AddSharingUserUseCase;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findByUserId: mock(() => Promise.resolve(null)),
      create: mock((loc: Location) => Promise.resolve(loc)),
      save: mock((loc: Location) => Promise.resolve(loc)),
    } as unknown as LocationRepository;

    useCase = new AddSharingUserUseCase(mockLocationRepository);
  });

  describe("execute", () => {
    it("should create new location when none exists and add user", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.isSharingLocation).toBe(true);
        expect(result.value.usersToShareWith).toHaveLength(1);
        expect(result.value.usersToShareWith[0]).toEqual({
          id: "user-456",
          firstName: "John",
          lastName: "Doe",
        });
      }
    });

    it("should return error when trying to add self", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-123",
        userFirstName: "John",
        userLastName: "Doe",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Cannot share location with yourself");
      }
    });

    it("should add user to existing location", async () => {
      const existingLocation = createMockLocation({
        usersToShareWith: [
          { id: "user-1", firstName: "Alice", lastName: "Smith" },
        ],
        addSharingUser: function (user: unknown) {
          return {
            kind: "ok",
            value: {
              ...this,
              usersToShareWith: [...this.usersToShareWith, user],
            },
          };
        },
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(existingLocation),
      );

      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[1].id).toBe("user-456");
      }
    });

    it("should handle null first and last names", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: null,
        userLastName: null,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith[0].firstName).toBeNull();
        expect(result.value.usersToShareWith[0].lastName).toBeNull();
      }
    });

    it("should persist changes with save for existing location", async () => {
      const existingLocation = createMockLocation();
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(existingLocation),
      );

      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      await useCase.execute(input);

      expect(mockLocationRepository.save).toHaveBeenCalled();
    });

    it("should create new location via create method when none exists", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-123",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      await useCase.execute(input);

      expect(mockLocationRepository.create).toHaveBeenCalled();
    });

    it("should call findByUserId with ownerUserId", async () => {
      const input: AddSharingUserInput = {
        ownerUserId: "user-789",
        userToAddId: "user-456",
        userFirstName: "John",
        userLastName: "Doe",
      };

      await useCase.execute(input);

      expect(mockLocationRepository.findByUserId).toHaveBeenCalledWith(
        "user-789",
      );
    });
  });
});
