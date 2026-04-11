import { describe, it, expect, mock } from "bun:test";
import { UpdateSponsorUseCase, type UpdateSponsorInput } from "./UpdateSponsor";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] UpdateSponsorUseCase", () => {
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
    it("should update sponsor name successfully", async () => {
      const existingSponsor = createValidSponsor({
        id: "sponsor-456",
        name: "Old Name",
      });
      const updatedSponsor = createValidSponsor({
        id: "sponsor-456",
        name: "New Name",
      });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
        update: mock(() => Promise.resolve(updatedSponsor)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        name: "New Name",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("New Name");
        expect(result.value.id).toBe("sponsor-456");
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("sponsor-456");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update sponsor description and logo", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
        update: mock(() => Promise.resolve(existingSponsor)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        description: "Updated description",
        logoPath: "/logos/updated.png",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update sponsor positioning fields", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
        update: mock(() => Promise.resolve(existingSponsor)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        height: 150,
        offsetX: 25,
        offsetY: 30,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should activate/deactivate sponsor", async () => {
      const existingSponsor = createValidSponsor({
        id: "sponsor-456",
        isActive: true,
      });
      const inactiveSponsor = createValidSponsor({
        id: "sponsor-456",
        isActive: false,
      });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
        update: mock(() => Promise.resolve(inactiveSponsor)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        isActive: false,
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(false);
      }
    });

    it("should return error when sponsor not found", async () => {
      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(null)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "non-existent",
        name: "New Name",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Sponsor not found");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when validation fails", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        name: "", // Invalid empty name
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
    });

    it("should handle repository errors", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const mockRepo = createMockRepo({
        findById: mock(() => Promise.resolve(existingSponsor)),
        update: mock(() => Promise.reject(new Error("Update failed"))),
      });

      const useCase = new UpdateSponsorUseCase(mockRepo);
      const input: UpdateSponsorInput = {
        sponsorId: "sponsor-456",
        name: "New Name",
      };

      await expect(useCase.execute(input)).rejects.toThrow("Update failed");
    });
  });
});
