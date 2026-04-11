import { describe, it, expect, mock } from "bun:test";
import { CreateSponsorUseCase, type CreateSponsorInput } from "./CreateSponsor";
import { Sponsor } from "@mirai-app/domain";
import type { SponsorRepository } from "../ports/SponsorRepository";

describe("[UNIT] CreateSponsorUseCase", () => {
  // Helper to create a valid sponsor
  const createValidSponsor = (
    overrides?: Partial<{
      id: string;
      name: string;
    }>,
  ): Sponsor => {
    const result = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
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
    it("should create sponsor with valid input", async () => {
      // Arrange
      const sponsorResult = Sponsor.create({
        id: "sponsor-456",
        name: "Acme Corp",
        description: "A leading technology company",
        logoPath: "/logos/acme.png",
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
        create: mock(() => Promise.resolve(mockSponsor)),
      });

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Acme Corp",
        description: "A leading technology company",
        logoPath: "/logos/acme.png",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Acme Corp");
        expect(result.value.description).toBe("A leading technology company");
        expect(result.value.logoPath).toBe("/logos/acme.png");
        expect(result.value.isActive).toBe(true);
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when name is empty", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "", // Empty name
        description: "Description",
        logoPath: "/logo.png",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }
    });

    it("should return error when description is empty", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Test Sponsor",
        description: "", // Empty description
        logoPath: "/logo.png",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("description");
      }
    });

    it("should return error when logoPath is empty", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Test Sponsor",
        description: "Description",
        logoPath: "", // Empty logoPath
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("logoPath");
      }
    });

    it("should create sponsor with optional positioning fields", async () => {
      // Arrange
      const mockSponsor = createValidSponsor({ id: "sponsor-789" });
      const mockRepo = createMockRepo({
        create: mock(() => Promise.resolve(mockSponsor)),
      });

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Positioned Sponsor",
        description: "A sponsor with positioning",
        logoPath: "/logos/positioned.png",
        height: 100,
        offsetX: 10,
        offsetY: 20,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should create inactive sponsor when specified", async () => {
      // Arrange
      const sponsorResult = Sponsor.create({
        id: "sponsor-inactive",
        name: "Inactive Sponsor",
        description: "This sponsor is inactive",
        logoPath: "/logos/inactive.png",
        height: null,
        offsetX: null,
        offsetY: null,
        isActive: false,
      });
      if (sponsorResult.kind === "err") {
        throw new Error("Failed to create test sponsor");
      }
      const mockSponsor = sponsorResult.value;

      const mockRepo = createMockRepo({
        create: mock(() => Promise.resolve(mockSponsor)),
      });

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Inactive Sponsor",
        description: "This sponsor is inactive",
        logoPath: "/logos/inactive.png",
        isActive: false,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(false);
      }
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        create: mock(() => Promise.reject(new Error("Create failed"))),
      });

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logo.png",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("Create failed");
    });

    it("should use default values for optional fields", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new CreateSponsorUseCase(mockRepo);
      const input: CreateSponsorInput = {
        name: "Minimal Sponsor",
        description: "A minimal sponsor",
        logoPath: "/logo.png",
        // height, offsetX, offsetY, isActive not provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });
});
