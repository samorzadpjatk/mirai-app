import { describe, it, expect, beforeEach } from "bun:test";
import {
  GetLocationUseCase,
  getLocationUseCase,
  type GetLocationInput,
  LocationNotFoundError,
} from "./GetLocation";
import { Location, isOk, isErr } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { InMemoryLocationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] GetLocationUseCase (Effect.gen)", () => {
  let repo: InMemoryLocationRepository;
  let useCase: GetLocationUseCase;

  beforeEach(() => {
    repo = new InMemoryLocationRepository();
    useCase = new GetLocationUseCase(repo);
  });

  const createValidLocation = (
    overrides?: Partial<{
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
      isSharingLocation: boolean;
    }>,
  ): Location => {
    const effect = Location.create({
      id: overrides?.id ?? "loc-123",
      userId: overrides?.userId ?? "user-123",
      latitude: overrides?.latitude ?? 52.52,
      longitude: overrides?.longitude ?? 13.405,
      accuracy: 10,
      altitude: 100,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 25,
      isSharingLocation: overrides?.isSharingLocation ?? false,
      usersToShareWith: [],
    });
    return Effect.runSync(effect);
  };

  const runUseCase = async (input: GetLocationInput) => {
    const program = useCase.execute(input);
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return location when found by userId", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-456",
        userId: "user-456",
        latitude: 48.8566,
        longitude: 2.3522,
      });
      await Effect.runPromise(repo.create(mockLocation));

      // Act
      const result = await runUseCase({ userId: "user-456" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("loc-456");
        expect(result.value.userId).toBe("user-456");
        expect(result.value.latitude).toBe(48.8566);
        expect(result.value.longitude).toBe(2.3522);
        expect(result.value.accuracy).toBe(10);
        expect(result.value.altitude).toBe(100);
        expect(result.value.altitudeAccuracy).toBe(5);
        expect(result.value.heading).toBe(90);
        expect(result.value.speed).toBe(25);
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.timestamp).toBeInstanceOf(Date);
        expect(result.value.usersToShareWith).toEqual([]);
      }
    });

    it("should fail when location not found", async () => {
      // Act
      const result = await runUseCase({ userId: "non-existent-user" });

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(LocationNotFoundError);
      }
    });

    it("should return location with null coordinates", async () => {
      // Arrange - Create location with explicit null coordinates
      const mockLocation = Effect.runSync(
        Location.create({
          id: "loc-789",
          userId: "user-789",
          latitude: null,
          longitude: null,
          accuracy: null,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          isSharingLocation: false,
          usersToShareWith: [],
        }),
      );
      await Effect.runPromise(repo.create(mockLocation));

      // Act
      const result = await runUseCase({ userId: "user-789" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("loc-789");
        expect(result.value.userId).toBe("user-789");
        expect(result.value.latitude).toBeNull();
        expect(result.value.longitude).toBeNull();
      }
    });

    it("should return sharing location status correctly", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        userId: "user-sharing",
        isSharingLocation: true,
      });
      await Effect.runPromise(repo.create(mockLocation));

      // Act
      const result = await runUseCase({ userId: "user-sharing" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should return location with sharing users list", async () => {
      // Arrange
      const mockLocation = Effect.runSync(
        Location.create({
          id: "loc-sharing",
          userId: "user-owner",
          latitude: 52.52,
          longitude: 13.405,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          isSharingLocation: true,
          usersToShareWith: [
            { id: "user-1", firstName: "John", lastName: "Doe" },
            { id: "user-2", firstName: "Jane", lastName: "Smith" },
          ],
        }),
      );
      await Effect.runPromise(repo.create(mockLocation));

      // Act
      const result = await runUseCase({ userId: "user-owner" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[0].firstName).toBe("John");
        expect(result.value.usersToShareWith[1].firstName).toBe("Jane");
      }
    });

    it("should propagate repository errors", async () => {
      // Arrange - Create a repo that fails
      const failingRepo = new InMemoryLocationRepository();
      // Override findByUserId to fail
      const originalFindByUserId = failingRepo.findByUserId.bind(failingRepo);
      failingRepo.findByUserId = (userId: string) =>
        Effect.fail({
          _tag: "DatabaseError",
          message: "DB error",
        } as any);

      const useCaseWithFailingRepo = new GetLocationUseCase(failingRepo);

      // Act & Assert
      const program = useCaseWithFailingRepo.execute({ userId: "user-123" });
      const either = await Effect.runPromise(Effect.either(program));
      expect(either._tag).toBe("Left");
    });
  });

  describe("[UNIT] legacy getLocationUseCase function", () => {
    it("should work with legacy function API", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-legacy",
        userId: "user-legacy",
      });
      await Effect.runPromise(repo.create(mockLocation));

      // Act
      const program = getLocationUseCase({ userId: "user-legacy" }, repo);
      const result = await Effect.runPromise(program);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("loc-legacy");
      }
    });
  });
});
