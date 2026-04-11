import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetSharingSettingsUseCase,
  type GetSharingSettingsInput,
} from "./GetSharingSettings";
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
    ...overrides,
  }) as Location;

describe("[UNIT] GetSharingSettingsUseCase", () => {
  let useCase: GetSharingSettingsUseCase;
  let mockLocationRepository: LocationRepository;

  beforeEach(() => {
    mockLocationRepository = {
      findByUserId: mock(() => Promise.resolve(null)),
    } as unknown as LocationRepository;

    useCase = new GetSharingSettingsUseCase(mockLocationRepository);
  });

  describe("execute", () => {
    it("should return default settings when no location exists", async () => {
      const input: GetSharingSettingsInput = { userId: "user-123" };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should return sharing settings when location exists", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ],
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(mockLocation),
      );

      const input: GetSharingSettingsInput = { userId: "user-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(true);
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[0]).toEqual({
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
        });
      }
    });

    it("should handle location with sharing disabled", async () => {
      const mockLocation = createMockLocation({
        isSharingLocation: () => false,
        usersToShareWith: [],
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(mockLocation),
      );

      const input: GetSharingSettingsInput = { userId: "user-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should handle location with users sharing with null names", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [{ id: "user-1", firstName: null, lastName: null }],
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(mockLocation),
      );

      const input: GetSharingSettingsInput = { userId: "user-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith[0].firstName).toBeNull();
        expect(result.value.usersToShareWith[0].lastName).toBeNull();
      }
    });

    it("should handle location with empty usersToShareWith", async () => {
      const mockLocation = createMockLocation({
        usersToShareWith: [],
      });
      mockLocationRepository.findByUserId = mock(() =>
        Promise.resolve(mockLocation),
      );

      const input: GetSharingSettingsInput = { userId: "user-123" };
      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should call findByUserId with correct userId", async () => {
      const input: GetSharingSettingsInput = { userId: "user-456" };

      await useCase.execute(input);

      expect(mockLocationRepository.findByUserId).toHaveBeenCalledWith(
        "user-456",
      );
    });
  });
});
