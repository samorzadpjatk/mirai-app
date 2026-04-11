import { describe, it, expect, mock } from "bun:test";
import { ListSponsorsUseCase, type ListSponsorsInput } from "./ListSponsors";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] ListSponsorsUseCase", () => {
  const createValidSponsor = (
    overrides?: Partial<{ id: string; name: string; isActive: boolean }>,
  ): Sponsor => {
    const result = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/logos/test.png",
      height: null,
      offsetX: null,
      offsetY: null,
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
    it("should list all sponsors", async () => {
      const mockSponsors = [
        createValidSponsor({ id: "sponsor-1", name: "Sponsor 1" }),
        createValidSponsor({ id: "sponsor-2", name: "Sponsor 2" }),
        createValidSponsor({
          id: "sponsor-3",
          name: "Sponsor 3",
          isActive: false,
        }),
      ];
      const mockRepo = createMockRepo({
        findAll: mock(() => Promise.resolve(mockSponsors)),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = {};

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sponsors).toHaveLength(3);
        expect(result.value.total).toBe(3);
        expect(result.value.sponsors[0].name).toBe("Sponsor 1");
        expect(result.value.sponsors[1].name).toBe("Sponsor 2");
        expect(result.value.sponsors[2].isActive).toBe(false);
      }
      expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });

    it("should list only active sponsors when activeOnly is true", async () => {
      const activeSponsors = [
        createValidSponsor({ id: "sponsor-1", name: "Active Sponsor 1" }),
        createValidSponsor({ id: "sponsor-2", name: "Active Sponsor 2" }),
      ];
      const mockRepo = createMockRepo({
        findActive: mock(() => Promise.resolve(activeSponsors)),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = { activeOnly: true };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sponsors).toHaveLength(2);
        expect(result.value.sponsors.every((s) => s.isActive)).toBe(true);
      }
      expect(mockRepo.findActive).toHaveBeenCalled();
      expect(mockRepo.findAll).not.toHaveBeenCalled();
    });

    it("should apply pagination options", async () => {
      const mockRepo = createMockRepo({
        findAll: mock(() => Promise.resolve([])),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = {
        limit: 10,
        offset: 20,
      };

      await useCase.execute(input);

      expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 });
    });

    it("should return empty list when no sponsors exist", async () => {
      const mockRepo = createMockRepo({
        findAll: mock(() => Promise.resolve([])),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = {};

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sponsors).toHaveLength(0);
        expect(result.value.total).toBe(0);
      }
    });

    it("should use default values when no input provided", async () => {
      const mockRepo = createMockRepo({
        findAll: mock(() => Promise.resolve([])),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);

      await useCase.execute();

      expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 100, offset: 0 });
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findAll: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = {};

      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });

    it("should handle findActive repository errors", async () => {
      const mockRepo = createMockRepo({
        findActive: mock(() =>
          Promise.reject(new Error("Active query failed")),
        ),
      });

      const useCase = new ListSponsorsUseCase(mockRepo);
      const input: ListSponsorsInput = { activeOnly: true };

      await expect(useCase.execute(input)).rejects.toThrow(
        "Active query failed",
      );
    });
  });
});
