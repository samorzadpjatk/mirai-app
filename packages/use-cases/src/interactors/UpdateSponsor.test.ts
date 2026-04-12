import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./UpdateSponsor";
import { Sponsor } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

describe("[UNIT] updateSponsorUseCase (Effect)", () => {
  // Helper to create a valid sponsor using Effect
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

  // Helper to create mock repository service
  const createMockRepoService = (overrides?: {
    findById?: (id: string) => Promise<Sponsor | null>;
    update?: (sponsor: Sponsor) => Promise<Sponsor>;
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
      Effect.promise(() =>
        overrides?.update
          ? overrides.update(sponsor)
          : Promise.resolve(sponsor),
      ),
    delete: () => Effect.promise(() => Promise.resolve()),
    exists: () => Effect.promise(() => Promise.resolve(false)),
    isLinkedToTrip: () => Effect.promise(() => Promise.resolve(false)),
    linkToTrip: () => Effect.promise(() => Promise.resolve()),
    unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
  });

  // Helper to run use case with repository service
  const runUseCase = async (
    input: UpdateSponsorInput,
    repoOverrides?: {
      findById?: (id: string) => Promise<Sponsor | null>;
      update?: (sponsor: Sponsor) => Promise<Sponsor>;
    },
  ) => {
    const program = updateSponsorUseCase(input).pipe(
      Effect.provideService(
        SponsorRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

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

      const result = await runUseCase(
        { sponsorId: "sponsor-456", name: "New Name" },
        {
          findById: () => Promise.resolve(existingSponsor),
          update: () => Promise.resolve(updatedSponsor),
        },
      );

      expect(result.name).toBe("New Name");
      expect(result.id).toBe("sponsor-456");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should update sponsor description and logo", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const result = await runUseCase(
        {
          sponsorId: "sponsor-456",
          description: "Updated description",
          logoPath: "/logos/updated.png",
        },
        {
          findById: () => Promise.resolve(existingSponsor),
          update: (s) => Promise.resolve(s),
        },
      );

      expect(result).toBeDefined();
    });

    it("should update sponsor positioning fields", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const result = await runUseCase(
        {
          sponsorId: "sponsor-456",
          height: 150,
          offsetX: 25,
          offsetY: 30,
        },
        {
          findById: () => Promise.resolve(existingSponsor),
          update: (s) => Promise.resolve(s),
        },
      );

      expect(result).toBeDefined();
    });

    it("should activate/deactivate sponsor", async () => {
      const existingSponsor = createValidSponsor({
        id: "sponsor-456",
        isActive: true,
      });
      const inactiveEffect = Sponsor.create({
        id: "sponsor-456",
        name: "Test Sponsor",
        description: "A test sponsor description",
        logoPath: "/logos/test.png",
        height: null,
        offsetX: null,
        offsetY: null,
        isActive: false,
      });
      const inactiveSponsor = Effect.runSync(inactiveEffect);

      const result = await runUseCase(
        { sponsorId: "sponsor-456", isActive: false },
        {
          findById: () => Promise.resolve(existingSponsor),
          update: () => Promise.resolve(inactiveSponsor),
        },
      );

      expect(result.isActive).toBe(false);
    });

    it("should fail when sponsor not found", async () => {
      const program = updateSponsorUseCase({
        sponsorId: "non-existent",
        name: "New Name",
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({ findById: () => Promise.resolve(null) }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateSponsorNotFoundError);
      }
    });

    it("should fail when validation fails", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const program = updateSponsorUseCase({
        sponsorId: "sponsor-456",
        name: "", // Invalid empty name
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            findById: () => Promise.resolve(existingSponsor),
          }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateSponsorValidationError);
      }
    });

    it("should propagate repository errors as defects", async () => {
      const existingSponsor = createValidSponsor({ id: "sponsor-456" });

      const program = updateSponsorUseCase({
        sponsorId: "sponsor-456",
        name: "New Name",
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            findById: () => Promise.resolve(existingSponsor),
            update: () => Promise.reject(new Error("Update failed")),
          }),
        ),
      );

      await expect(Effect.runPromise(program)).rejects.toThrow("Update failed");
    });
  });
});
