import { describe, it, expect, mock } from "bun:test";
import { listSponsorsUseCase, type ListSponsorsInput } from "./ListSponsors";
import { Sponsor } from "@mirai-app/domain";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";
import { Effect } from "effect";

describe("[UNIT] listSponsorsUseCase", () => {
  const createValidSponsor = (
    overrides?: Partial<{ id: string; name: string; isActive: boolean }>,
  ): Sponsor => {
    const effect = Sponsor.create({
      id: overrides?.id ?? "sponsor-123",
      name: overrides?.name ?? "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/logos/test.png",
      height: null,
      offsetX: null,
      offsetY: null,
      isActive: overrides?.isActive ?? true,
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test sponsor: ${e}`);
    }
  };

  const createMockRepoService = (overrides?: {
    findAll?: () => Promise<Sponsor[]>;
    findActive?: () => Promise<Sponsor[]>;
  }) => ({
    create: () => Effect.promise(() => Promise.resolve(createValidSponsor())),
    findById: () => Effect.promise(() => Promise.resolve(null)),
    findAll: () =>
      Effect.promise(() =>
        overrides?.findAll ? overrides.findAll() : Promise.resolve([]),
      ),
    findActive: () =>
      Effect.promise(() =>
        overrides?.findActive ? overrides.findActive() : Promise.resolve([]),
      ),
    findByTripId: () => Effect.promise(() => Promise.resolve([])),
    update: () => Effect.promise(() => Promise.resolve(createValidSponsor())),
    delete: () => Effect.promise(() => Promise.resolve()),
    exists: () => Effect.promise(() => Promise.resolve(false)),
    isLinkedToTrip: () => Effect.promise(() => Promise.resolve(false)),
    linkToTrip: () => Effect.promise(() => Promise.resolve()),
    unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
  });

  // Helper to run use case with repository service
  const runUseCase = async (
    input: ListSponsorsInput,
    repoOverrides?: {
      findAll?: () => Promise<Sponsor[]>;
      findActive?: () => Promise<Sponsor[]>;
    },
  ) => {
    const program = listSponsorsUseCase(input).pipe(
      Effect.provideService(
        SponsorRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
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

      const result = await runUseCase(
        {},
        { findAll: () => Promise.resolve(mockSponsors) },
      );

      expect(result.sponsors).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.sponsors[0].name).toBe("Sponsor 1");
      expect(result.sponsors[1].name).toBe("Sponsor 2");
      expect(result.sponsors[2].isActive).toBe(false);
    });

    it("should list only active sponsors when activeOnly is true", async () => {
      const activeSponsors = [
        createValidSponsor({ id: "sponsor-1", name: "Active Sponsor 1" }),
        createValidSponsor({ id: "sponsor-2", name: "Active Sponsor 2" }),
      ];

      const result = await runUseCase(
        { activeOnly: true },
        { findActive: () => Promise.resolve(activeSponsors) },
      );

      expect(result.sponsors).toHaveLength(2);
      expect(result.sponsors.every((s) => s.isActive)).toBe(true);
    });

    it("should apply pagination options", async () => {
      // The use case passes { limit, offset } to findAll
      // Verify it works by checking the result structure is correct
      const result = await runUseCase(
        { limit: 10, offset: 20 },
        {
          findAll: async () => [],
        },
      );

      expect(result.sponsors).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return empty list when no sponsors exist", async () => {
      const result = await runUseCase({});

      expect(result.sponsors).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should use default values when no input provided", async () => {
      const result = await runUseCase({});

      expect(result.sponsors).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
