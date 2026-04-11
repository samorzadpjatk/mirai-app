import { describe, it, expect, mock } from "bun:test";
import { DeleteSponsorUseCase, type DeleteSponsorInput } from "./DeleteSponsor";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] DeleteSponsorUseCase", () => {
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
    it("should delete sponsor successfully", async () => {
      const mockRepo = createMockRepo({
        exists: mock(() => Promise.resolve(true)),
        delete: mock(() => Promise.resolve()),
      });

      const useCase = new DeleteSponsorUseCase(mockRepo);
      const input: DeleteSponsorInput = {
        sponsorId: "sponsor-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("sponsor-456");
        expect(result.value.deleted).toBe(true);
      }
      expect(mockRepo.exists).toHaveBeenCalledWith("sponsor-456");
      expect(mockRepo.delete).toHaveBeenCalledWith("sponsor-456");
    });

    it("should return error when sponsor not found", async () => {
      const mockRepo = createMockRepo({
        exists: mock(() => Promise.resolve(false)),
      });

      const useCase = new DeleteSponsorUseCase(mockRepo);
      const input: DeleteSponsorInput = {
        sponsorId: "non-existent",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Sponsor not found");
      }
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("should handle repository errors during exists check", async () => {
      const mockRepo = createMockRepo({
        exists: mock(() => Promise.reject(new Error("Exists check failed"))),
      });

      const useCase = new DeleteSponsorUseCase(mockRepo);
      const input: DeleteSponsorInput = {
        sponsorId: "sponsor-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        "Exists check failed",
      );
    });

    it("should handle repository errors during delete", async () => {
      const mockRepo = createMockRepo({
        exists: mock(() => Promise.resolve(true)),
        delete: mock(() => Promise.reject(new Error("Delete failed"))),
      });

      const useCase = new DeleteSponsorUseCase(mockRepo);
      const input: DeleteSponsorInput = {
        sponsorId: "sponsor-123",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Delete failed");
    });
  });
});
