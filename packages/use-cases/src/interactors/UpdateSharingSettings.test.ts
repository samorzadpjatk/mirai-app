import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  UpdateSharingSettingsUseCase,
  type UpdateSharingSettingsInput,
} from "./UpdateSharingSettings";
import type { LocationRepository } from "../ports/LocationRepository";
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
      return { ...this, isSharingLocation: () => true };
    },
    stopSharing: function () {
      return { ...this, isSharingLocation: () => false };
    },
    updateSharingUsers: function (users: unknown[]) {
      return { kind: "ok", value: { ...this, usersToShareWith: users } };
    },
    ...overrides,
  }) as unknown as Location;

describe("[UNIT] UpdateSharingSettingsUseCase", () => {
  let useCase: UpdateSharingSettingsUseCase;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findByUserId: mock(() => Promise.resolve(null)),
      save: mock((loc: Location) => Promise.resolve(loc)),
      create: mock((loc: Location) => Promise.resolve(loc)),
    } as unknown as LocationRepository;

    useCase = new UpdateSharingSettingsUseCase(mockLocationRepository);
  });

  describe("execute", () => {
    it("should create new location when none exists with sharing enabled", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.isSharingLocation).toBe(true);
        expect(result.value.usersToShareWith).toHaveLength(1);
      }
    });

    it("should create new location when none exists with sharing disabled", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: false,
        usersToShareWith: [],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should update existing location to enable sharing", async () => {
      const existingLocation = createMockLocation({
        isSharingLocation: () => false,
        startSharing: function () {
          return { ...this, isSharingLocation: () => true } as Location;
        },
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(existingLocation),
      );

      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should update existing location to disable sharing", async () => {
      const existingLocation = createMockLocation({
        isSharingLocation: () => true,
        stopSharing: function () {
          return { ...this, isSharingLocation: () => false } as Location;
        },
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(existingLocation),
      );

      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(false);
      }
    });

    it("should update users to share with for existing location", async () => {
      const existingLocation = createMockLocation({
        usersToShareWith: [],
        updateSharingUsers: function (users: unknown[]) {
          return { kind: "ok", value: { ...this, usersToShareWith: users } };
        },
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(existingLocation),
      );

      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[0].id).toBe("user-1");
      }
    });

    it("should persist changes to repository", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      await useCase.execute(input);

      expect(mockLocationRepository.save).toHaveBeenCalled();
    });

    it("should call findByUserId with correct userId", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-456",
        isSharingLocation: true,
      };

      await useCase.execute(input);

      expect(mockLocationRepository.findByUserId).toHaveBeenCalledWith(
        "user-456",
      );
    });

    it("should include timestamp in output", async () => {
      const input: UpdateSharingSettingsInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.timestamp).toBeInstanceOf(Date);
      }
    });
  });
});
