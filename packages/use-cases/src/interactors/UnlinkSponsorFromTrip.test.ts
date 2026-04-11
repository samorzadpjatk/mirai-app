import { describe, it, expect, mock } from "bun:test";
import {
  UnlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
} from "./UnlinkSponsorFromTrip";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] UnlinkSponsorFromTripUseCase", () => {
  const createMockRepo = (
    overrides?: Partial<SponsorRepository>,
  ): SponsorRepository => ({
    create: mock(() => Promise.resolve({} as any)),
    findById: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    findActive: mock(() => Promise.resolve([])),
    findByTripId: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve({} as any)),
    delete: mock(() => Promise.resolve()),
    exists: mock(() => Promise.resolve(false)),
    isLinkedToTrip: mock(() => Promise.resolve(false)),
    linkToTrip: mock(() => Promise.resolve()),
    unlinkFromTrip: mock(() => Promise.resolve()),
    ...overrides,
  });

  describe("execute", () => {
    it("should unlink sponsor from trip successfully", async () => {
      const mockRepo = createMockRepo({
        unlinkFromTrip: mock(() => Promise.resolve()),
      });

      const useCase = new UnlinkSponsorFromTripUseCase(mockRepo);
      const input: UnlinkSponsorFromTripInput = {
        sponsorId: "sponsor-456",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sponsorId).toBe("sponsor-456");
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.unlinked).toBe(true);
      }
      expect(mockRepo.unlinkFromTrip).toHaveBeenCalledWith(
        "sponsor-456",
        "trip-123",
      );
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        unlinkFromTrip: mock(() => Promise.reject(new Error("Unlink failed"))),
      });

      const useCase = new UnlinkSponsorFromTripUseCase(mockRepo);
      const input: UnlinkSponsorFromTripInput = {
        sponsorId: "sponsor-123",
        tripId: "trip-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Unlink failed");
    });
  });
});
