import { describe, it, expect, mock } from "bun:test";
import {
  LinkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
} from "./LinkSponsorToTrip";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] LinkSponsorToTripUseCase", () => {
  const createValidSponsor = (
    overrides?: Partial<{ id: string; name: string }>,
  ): Sponsor => {
    const result = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor",
      logoPath: "/logos/test.png",
      height: null,
      offsetX: null,
      offsetY: null,
      isActive: true,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test sponsor: ${result.error.message}`);
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<SponsorRepository>,
  ): SponsorRepository => ({
    create: mock(() => Promise.resolve(createValidSponsor())),
    findById: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    findActive: mock(() => Promise.resolve([])),
    findByTripId: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve(createValidSponsor())),
    delete: mock(() => Promise.resolve()),
    exists: mock(() => Promise.resolve(false)),
    isLinkedToTrip: mock(() => Promise.resolve(false)),
    linkToTrip: mock(() => Promise.resolve()),
    unlinkFromTrip: mock(() => Promise.resolve()),
    ...overrides,
  });

  describe("execute", () => {
    it("should link sponsor to trip successfully", async () => {
      const mockSponsor = createValidSponsor({ id: "sponsor-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSponsor)),
        isLinkedToTrip: mock(() => Promise.resolve(false)),
        linkToTrip: mock(() => Promise.resolve()),
      });

      const useCase = new LinkSponsorToTripUseCase(mockRepo);
      const input: LinkSponsorToTripInput = {
        sponsorId: "sponsor-456",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sponsorId).toBe("sponsor-456");
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.linked).toBe(true);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("sponsor-456");
      expect(mockRepo.isLinkedToTrip).toHaveBeenCalledWith(
        "sponsor-456",
        "trip-123",
      );
      expect(mockRepo.linkToTrip).toHaveBeenCalledWith(
        "sponsor-456",
        "trip-123",
      );
    });

    it("should return error when sponsor not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new LinkSponsorToTripUseCase(mockRepo);
      const input: LinkSponsorToTripInput = {
        sponsorId: "non-existent",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Sponsor not found");
      }
      expect(mockRepo.linkToTrip).not.toHaveBeenCalled();
    });

    it("should return error when sponsor already linked to trip", async () => {
      const mockSponsor = createValidSponsor({ id: "sponsor-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSponsor)),
        isLinkedToTrip: mock(() => Promise.resolve(true)),
      });

      const useCase = new LinkSponsorToTripUseCase(mockRepo);
      const input: LinkSponsorToTripInput = {
        sponsorId: "sponsor-456",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe(
          "Sponsor is already associated with this trip",
        );
      }
      expect(mockRepo.linkToTrip).not.toHaveBeenCalled();
    });

    it("should handle repository errors during find", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.reject(new Error("Find failed"))),
      });

      const useCase = new LinkSponsorToTripUseCase(mockRepo);
      const input: LinkSponsorToTripInput = {
        sponsorId: "sponsor-123",
        tripId: "trip-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Find failed");
    });

    it("should handle repository errors during link", async () => {
      const mockSponsor = createValidSponsor({ id: "sponsor-456" });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSponsor)),
        isLinkedToTrip: mock(() => Promise.resolve(false)),
        linkToTrip: mock(() => Promise.reject(new Error("Link failed"))),
      });

      const useCase = new LinkSponsorToTripUseCase(mockRepo);
      const input: LinkSponsorToTripInput = {
        sponsorId: "sponsor-456",
        tripId: "trip-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Link failed");
    });
  });
});
