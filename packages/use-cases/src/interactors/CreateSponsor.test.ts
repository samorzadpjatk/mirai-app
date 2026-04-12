import { describe, it, expect, beforeEach } from "bun:test";
import {
  createSponsorUseCase,
  type CreateSponsorInput,
  CreateSponsorValidationError,
} from "./CreateSponsor";
import { Sponsor } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

describe("[UNIT] createSponsorUseCase (Effect)", () => {
  // Helper to create a valid sponsor using Effect
  const createValidSponsor = (
    overrides?: Partial<{ id: string; name: string }>,
  ): Sponsor => {
    const effect = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/logos/test.png",
      height: null,
      offsetX: null,
      offsetY: null,
      isActive: true,
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test sponsor: ${e}`);
    }
  };

  // Helper to create mock repository service
  const createMockRepoService = (overrides?: {
    create?: (sponsor: Sponsor) => Promise<Sponsor>;
  }) => ({
    create: (sponsor: Sponsor) =>
      Effect.promise(() =>
        overrides?.create
          ? overrides.create(sponsor)
          : Promise.resolve(sponsor),
      ),
    findById: () => Effect.promise(() => Promise.resolve(null)),
    findAll: () => Effect.promise(() => Promise.resolve([])),
    findActive: () => Effect.promise(() => Promise.resolve([])),
    findByTripId: () => Effect.promise(() => Promise.resolve([])),
    update: (sponsor: Sponsor) =>
      Effect.promise(() => Promise.resolve(sponsor)),
    delete: () => Effect.promise(() => Promise.resolve()),
    exists: () => Effect.promise(() => Promise.resolve(false)),
    isLinkedToTrip: () => Effect.promise(() => Promise.resolve(false)),
    linkToTrip: () => Effect.promise(() => Promise.resolve()),
    unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
  });

  // Helper to run use case with repository service
  const runUseCase = async (
    input: CreateSponsorInput,
    repoOverrides?: { create?: (sponsor: Sponsor) => Promise<Sponsor> },
  ) => {
    const program = createSponsorUseCase(input).pipe(
      Effect.provideService(
        SponsorRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should create sponsor with valid input", async () => {
      // Create a mock sponsor that matches the input
      const mockSponsor = Effect.runSync(
        Sponsor.create({
          id: "sponsor-456",
          name: "Acme Corp",
          description: "A leading technology company",
          logoPath: "/logos/acme.png",
          height: null,
          offsetX: null,
          offsetY: null,
          isActive: true,
        }),
      );

      const result = await runUseCase(
        {
          name: "Acme Corp",
          description: "A leading technology company",
          logoPath: "/logos/acme.png",
        },
        { create: () => Promise.resolve(mockSponsor) },
      );

      expect(result.name).toBe("Acme Corp");
      expect(result.description).toBe("A leading technology company");
      expect(result.logoPath).toBe("/logos/acme.png");
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should fail when name is empty", async () => {
      const program = createSponsorUseCase({
        name: "",
        description: "Description",
        logoPath: "/logo.png",
      }).pipe(
        Effect.provideService(SponsorRepositoryTag, createMockRepoService()),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
      }
    });

    it("should fail when description is empty", async () => {
      const program = createSponsorUseCase({
        name: "Test Sponsor",
        description: "",
        logoPath: "/logo.png",
      }).pipe(
        Effect.provideService(SponsorRepositoryTag, createMockRepoService()),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
      }
    });

    it("should fail when logoPath is empty", async () => {
      const program = createSponsorUseCase({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "",
      }).pipe(
        Effect.provideService(SponsorRepositoryTag, createMockRepoService()),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
      }
    });

    it("should create sponsor with optional positioning fields", async () => {
      const mockSponsor = createValidSponsor({ id: "sponsor-789" });

      const result = await runUseCase(
        {
          name: "Positioned Sponsor",
          description: "A sponsor with positioning",
          logoPath: "/logos/positioned.png",
          height: 100,
          offsetX: 10,
          offsetY: 20,
        },
        { create: () => Promise.resolve(mockSponsor) },
      );

      expect(result.id).toBe("sponsor-789");
    });

    it("should create inactive sponsor when specified", async () => {
      const inactiveEffect = Sponsor.create({
        id: "sponsor-inactive",
        name: "Inactive Sponsor",
        description: "This sponsor is inactive",
        logoPath: "/logos/inactive.png",
        height: null,
        offsetX: null,
        offsetY: null,
        isActive: false,
      });
      const mockSponsor = Effect.runSync(inactiveEffect);

      const result = await runUseCase(
        {
          name: "Inactive Sponsor",
          description: "This sponsor is inactive",
          logoPath: "/logos/inactive.png",
          isActive: false,
        },
        { create: () => Promise.resolve(mockSponsor) },
      );

      expect(result.isActive).toBe(false);
    });

    it("should propagate repository errors as defects", async () => {
      const program = createSponsorUseCase({
        name: "Test Sponsor",
        description: "Description",
        logoPath: "/logo.png",
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            create: () => Promise.reject(new Error("Create failed")),
          }),
        ),
      );

      await expect(Effect.runPromise(program)).rejects.toThrow("Create failed");
    });
  });
});
