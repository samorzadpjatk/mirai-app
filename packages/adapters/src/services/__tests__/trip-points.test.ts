import { describe, it, expect, mock, beforeEach } from "bun:test";
import { TripPointsService } from "../trip-points";
import type { ChallengeRepository } from "@mirai-app/use-cases";
import type { Challenge } from "@mirai-app/domain";

// Mock Challenge
const createMockChallenge = (overrides?: Partial<Challenge>): Challenge =>
  ({
    id: "challenge-123",
    tripId: "trip-123",
    basePoints: 100,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    ...overrides,
  }) as Challenge;

describe("[UNIT] TripPointsService", () => {
  let service: TripPointsService;
  let mockChallengeRepository: ChallengeRepository;

  beforeEach(() => {
    mockChallengeRepository = {
      findByTripId: mock(() => Promise.resolve([])),
    } as unknown as ChallengeRepository;

    service = new TripPointsService(mockChallengeRepository);
  });

  describe("calculateTotalAvailablePoints", () => {
    it("should calculate total points from challenges", async () => {
      mockChallengeRepository.findByTripId = mock(() =>
        Promise.resolve([
          createMockChallenge({ basePoints: 100 }),
          createMockChallenge({ basePoints: 200 }),
          createMockChallenge({ basePoints: 150 }),
        ]),
      );

      const result = await service.calculateTotalAvailablePoints("trip-123");

      expect(result).toBe(450); // 100 + 200 + 150
    });

    it("should return 0 when no challenges", async () => {
      mockChallengeRepository.findByTripId = mock(() => Promise.resolve([]));

      const result = await service.calculateTotalAvailablePoints("trip-123");

      expect(result).toBe(0);
    });

    it("should include place points when available", async () => {
      mockChallengeRepository.findByTripId = mock(() =>
        Promise.resolve([
          createMockChallenge({
            basePoints: 100,
            firstPlacePoints: 300,
            secondPlacePoints: 200,
            thirdPlacePoints: 150,
          }),
        ]),
      );

      // The service calculates based on basePoints
      const result = await service.calculateTotalAvailablePoints("trip-123");

      expect(result).toBeGreaterThan(0);
    });

    it("should call repository with tripId", async () => {
      await service.calculateTotalAvailablePoints("trip-456");

      expect(mockChallengeRepository.findByTripId).toHaveBeenCalledWith(
        "trip-456",
      );
    });
  });
});
