import { describe, it, expect } from "bun:test";
import {
  unlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
} from "./UnlinkSponsorFromTrip";
import { Effect } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

// Create mock repository service
const createMockRepoService = () => ({
  create: () => Effect.promise(() => Promise.resolve({} as any)),
  findById: () => Effect.promise(() => Promise.resolve(null)),
  findAll: () => Effect.promise(() => Promise.resolve([])),
  findActive: () => Effect.promise(() => Promise.resolve([])),
  findByTripId: () => Effect.promise(() => Promise.resolve([])),
  update: () => Effect.promise(() => Promise.resolve({} as any)),
  delete: () => Effect.promise(() => Promise.resolve()),
  exists: () => Effect.promise(() => Promise.resolve(false)),
  isLinkedToTrip: () => Effect.promise(() => Promise.resolve(false)),
  linkToTrip: () => Effect.promise(() => Promise.resolve()),
  unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
});

// Helper to run use case with repository service
const runUseCase = async (input: UnlinkSponsorFromTripInput) => {
  const program = unlinkSponsorFromTripUseCase(input).pipe(
    Effect.provideService(SponsorRepositoryTag, createMockRepoService()),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] unlinkSponsorFromTripUseCase (Effect)", () => {
  describe("[UNIT] execute", () => {
    it("should unlink sponsor from trip successfully", async () => {
      const input: UnlinkSponsorFromTripInput = {
        sponsorId: "sponsor-456",
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.sponsorId).toBe("sponsor-456");
      expect(result.tripId).toBe("trip-123");
      expect(result.unlinked).toBe(true);
    });
  });
});
