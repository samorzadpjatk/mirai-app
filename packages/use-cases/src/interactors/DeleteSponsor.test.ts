import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  DeleteSponsorNotFoundError,
} from "./DeleteSponsor";
import { Sponsor } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";

describe("[UNIT] deleteSponsorUseCase (Effect)", () => {
  // Helper to create mock repository service
  const createMockRepoService = (overrides?: {
    exists?: (id: string) => Promise<boolean>;
    delete?: (id: string) => Promise<void>;
  }) => ({
    create: (sponsor: Sponsor) =>
      Effect.promise(() => Promise.resolve(sponsor)),
    findById: () => Effect.promise(() => Promise.resolve(null)),
    findAll: () => Effect.promise(() => Promise.resolve([])),
    findActive: () => Effect.promise(() => Promise.resolve([])),
    findByTripId: () => Effect.promise(() => Promise.resolve([])),
    update: (sponsor: Sponsor) =>
      Effect.promise(() => Promise.resolve(sponsor)),
    delete: (id: string) =>
      Effect.promise(() =>
        overrides?.delete ? overrides.delete(id) : Promise.resolve(),
      ),
    exists: (id: string) =>
      Effect.promise(() =>
        overrides?.exists ? overrides.exists(id) : Promise.resolve(false),
      ),
    isLinkedToTrip: () => Effect.promise(() => Promise.resolve(false)),
    linkToTrip: () => Effect.promise(() => Promise.resolve()),
    unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
  });

  // Helper to run use case with repository service
  const runUseCase = async (
    input: DeleteSponsorInput,
    repoOverrides?: {
      exists?: (id: string) => Promise<boolean>;
      delete?: (id: string) => Promise<void>;
    },
  ) => {
    const program = deleteSponsorUseCase(input).pipe(
      Effect.provideService(
        SponsorRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should delete sponsor successfully", async () => {
      const result = await runUseCase(
        { sponsorId: "sponsor-456" },
        {
          exists: () => Promise.resolve(true),
          delete: () => Promise.resolve(),
        },
      );

      expect(result.id).toBe("sponsor-456");
      expect(result.deleted).toBe(true);
    });

    it("should fail when sponsor not found", async () => {
      const program = deleteSponsorUseCase({ sponsorId: "non-existent" }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({ exists: () => Promise.resolve(false) }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DeleteSponsorNotFoundError);
      }
    });

    it("should propagate repository errors during exists check as defects", async () => {
      const program = deleteSponsorUseCase({ sponsorId: "sponsor-123" }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            exists: () => Promise.reject(new Error("Exists check failed")),
          }),
        ),
      );

      await expect(Effect.runPromise(program)).rejects.toThrow(
        "Exists check failed",
      );
    });

    it("should propagate repository errors during delete as defects", async () => {
      const program = deleteSponsorUseCase({ sponsorId: "sponsor-123" }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            exists: () => Promise.resolve(true),
            delete: () => Promise.reject(new Error("Delete failed")),
          }),
        ),
      );

      await expect(Effect.runPromise(program)).rejects.toThrow("Delete failed");
    });
  });
});
