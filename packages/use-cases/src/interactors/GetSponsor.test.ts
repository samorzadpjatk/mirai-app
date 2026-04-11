import { describe, it, expect, mock } from "bun:test";
import { GetSponsorUseCase, type GetSponsorInput } from "./GetSponsor";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] GetSponsorUseCase", () => {
  const createValidSponsor = (
    overrides?: Partial<{ id: string; name: string; isActive: boolean }>,
  ): Sponsor => {
    const result = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/logos/test.png",
      height: 100,
      offsetX: 10,
      offsetY: 20,
      isActive: overrides?.isActive ?? true,
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
    it("should return sponsor when found", async () => {
      const mockSponsor = createValidSponsor({
        id: "sponsor-456",
        name: "Acme Corp",
        isActive: true,
      });
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSponsor)),
      });

      const useCase = new GetSponsorUseCase(mockRepo);
      const input: GetSponsorInput = {
        sponsorId: "sponsor-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("sponsor-456");
        expect(result.value.name).toBe("Acme Corp");
        expect(result.value.description).toBe("A test sponsor description");
        expect(result.value.logoPath).toBe("/logos/test.png");
        expect(result.value.height).toBe(100);
        expect(result.value.offsetX).toBe(10);
        expect(result.value.offsetY).toBe(20);
        expect(result.value.isActive).toBe(true);
        expect(result.value.hasLogoAdjustments).toBe(true);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("sponsor-456");
    });

    it("should return error when sponsor not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new GetSponsorUseCase(mockRepo);
      const input: GetSponsorInput = {
        sponsorId: "non-existent",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Sponsor not found");
      }
    });

    it("should return sponsor without logo adjustments", async () => {
      const sponsorResult = Sponsor.create({
        id: "sponsor-simple",
        name: "Simple Sponsor",
        description: "Simple description",
        logoPath: "/logos/simple.png",
        height: null,
        offsetX: null,
        offsetY: null,
        isActive: true,
      });
      if (sponsorResult.kind === "err") {
        throw new Error("Failed to create test sponsor");
      }
      const mockSponsor = sponsorResult.value;

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(mockSponsor)),
      });

      const useCase = new GetSponsorUseCase(mockRepo);
      const input: GetSponsorInput = {
        sponsorId: "sponsor-simple",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.height).toBeNull();
        expect(result.value.offsetX).toBeNull();
        expect(result.value.offsetY).toBeNull();
        expect(result.value.hasLogoAdjustments).toBe(false);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetSponsorUseCase(mockRepo);
      const input: GetSponsorInput = {
        sponsorId: "sponsor-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
