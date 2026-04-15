import { describe, it, expect, beforeEach } from "bun:test";
import {
  getSponsorUseCase,
  type GetSponsorInput,
  GetSponsorNotFoundError,
} from "./GetSponsor";
import { Sponsor, SponsorId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

describe("[UNIT] getSponsorUseCase (Effect)", () => {
  // Helper to create a valid sponsor using Effect
  const createValidSponsor = (
    overrides?: Partial<{ id: SponsorId; name: string; isActive: boolean }>,
  ): Sponsor => {
    const effect = Sponsor.create({
      id: overrides?.id ?? SponsorId.create("sponsor-123"),
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/logos/test.png",
      height: 100,
      offsetX: 10,
      offsetY: 20,
      isActive: overrides?.isActive ?? true,
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test sponsor: ${e}`);
    }
  };

  // Helper to create mock repository service
  const createMockRepoService = (overrides?: {
    findById?: (id: string) => Promise<Sponsor | null>;
  }) => ({
    create: (sponsor: Sponsor) =>
      Effect.promise(() => Promise.resolve(sponsor)),
    findById: (id: string) =>
      Effect.promise(() =>
        overrides?.findById ? overrides.findById(id) : Promise.resolve(null),
      ),
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
    input: GetSponsorInput,
    repoOverrides?: { findById?: (id: string) => Promise<Sponsor | null> },
  ) => {
    const program = getSponsorUseCase(input).pipe(
      Effect.provideService(
        SponsorRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return sponsor when found", async () => {
      const mockSponsor = createValidSponsor({
        id: SponsorId.create("sponsor-456"),
        name: "Acme Corp",
        isActive: true,
      });

      const result = await runUseCase(
        { sponsorId: SponsorId.create("sponsor-456") },
        { findById: () => Promise.resolve(mockSponsor) },
      );

      expect(result.id).toBe("sponsor-456");
      expect(result.name).toBe("Acme Corp");
      expect(result.description).toBe("A test sponsor description");
      expect(result.logoPath).toBe("/logos/test.png");
      expect(result.height).toBe(100);
      expect(result.offsetX).toBe(10);
      expect(result.offsetY).toBe(20);
      expect(result.isActive).toBe(true);
      expect(result.hasLogoAdjustments).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should fail when sponsor not found", async () => {
      const program = getSponsorUseCase({ sponsorId: "non-existent" }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({ findById: () => Promise.resolve(null) }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetSponsorNotFoundError);
      }
    });

    it("should return sponsor without logo adjustments", async () => {
      const sponsorResult = Sponsor.create({
        id: SponsorId.create("sponsor-simple"),
        name: "Simple Sponsor",
        description: "Simple description",
        logoPath: "/logos/simple.png",
        height: null,
        offsetX: null,
        offsetY: null,
        isActive: true,
      });
      const mockSponsor = Effect.runSync(sponsorResult);

      const result = await runUseCase(
        { sponsorId: SponsorId.create("sponsor-simple") },
        { findById: () => Promise.resolve(mockSponsor) },
      );

      expect(result.height).toBeNull();
      expect(result.offsetX).toBeNull();
      expect(result.offsetY).toBeNull();
      expect(result.hasLogoAdjustments).toBe(false);
    });
  });
});
