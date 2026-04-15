import { describe, it, expect } from "bun:test";
import {
  linkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  LinkSponsorNotFoundError,
  SponsorAlreadyLinkedError,
} from "./LinkSponsorToTrip";
import { Effect, Either } from "effect";
import { SponsorRepositoryTag } from "../ports/SponsorRepository";
import { Sponsor, SponsorId } from "@mirai-app/domain";

// Helper to create a valid sponsor using Effect
const createValidSponsor = (
  overrides?: Partial<{ id: SponsorId; name: string }>,
): Sponsor => {
  const effect = Sponsor.create({
    id: overrides?.id ?? SponsorId.create("sponsor-123"),
    name: overrides?.name ?? "Test Sponsor",
    description: "A test sponsor",
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

// Create mock repository service
const createMockRepoService = (overrides?: {
  findById?: (id: string) => Promise<Sponsor | null>;
  isLinkedToTrip?: (sponsorId: string, tripId: string) => Promise<boolean>;
}) => ({
  create: (sponsor: Sponsor) => Effect.promise(() => Promise.resolve(sponsor)),
  findById: (id: string) =>
    Effect.promise(() =>
      overrides?.findById ? overrides.findById(id) : Promise.resolve(null),
    ),
  findAll: () => Effect.promise(() => Promise.resolve([])),
  findActive: () => Effect.promise(() => Promise.resolve([])),
  findByTripId: () => Effect.promise(() => Promise.resolve([])),
  update: (sponsor: Sponsor) => Effect.promise(() => Promise.resolve(sponsor)),
  delete: () => Effect.promise(() => Promise.resolve()),
  exists: () => Effect.promise(() => Promise.resolve(false)),
  isLinkedToTrip: (sponsorId: string, tripId: string) =>
    Effect.promise(() =>
      overrides?.isLinkedToTrip
        ? overrides.isLinkedToTrip(sponsorId, tripId)
        : Promise.resolve(false),
    ),
  linkToTrip: () => Effect.promise(() => Promise.resolve()),
  unlinkFromTrip: () => Effect.promise(() => Promise.resolve()),
});

// Helper to run use case with repository service
const runUseCase = async (
  input: LinkSponsorToTripInput,
  repoOverrides?: {
    findById?: (id: string) => Promise<Sponsor | null>;
    isLinkedToTrip?: (sponsorId: string, tripId: string) => Promise<boolean>;
  },
) => {
  const program = linkSponsorToTripUseCase(input).pipe(
    Effect.provideService(
      SponsorRepositoryTag,
      createMockRepoService(repoOverrides),
    ),
  );
  return await Effect.runPromise(program);
};

describe("[UNIT] linkSponsorToTripUseCase", () => {
  describe("[UNIT] execute", () => {
    it("should link sponsor to trip successfully", async () => {
      const mockSponsor = createValidSponsor({
        id: SponsorId.create("sponsor-456"),
      });

      const result = await runUseCase(
        { sponsorId: SponsorId.create("sponsor-456"), tripId: "trip-123" },
        {
          findById: () => Promise.resolve(mockSponsor),
          isLinkedToTrip: () => Promise.resolve(false),
        },
      );

      expect(result.sponsorId).toBe("sponsor-456");
      expect(result.tripId).toBe("trip-123");
      expect(result.linked).toBe(true);
    });

    it("should fail when sponsor not found", async () => {
      const program = linkSponsorToTripUseCase({
        sponsorId: "non-existent",
        tripId: "trip-123",
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            findById: () => Promise.resolve(null),
          }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LinkSponsorNotFoundError);
      }
    });

    it("should fail when sponsor already linked to trip", async () => {
      const mockSponsor = createValidSponsor({
        id: SponsorId.create("sponsor-456"),
      });

      const program = linkSponsorToTripUseCase({
        sponsorId: SponsorId.create("sponsor-456"),
        tripId: "trip-123",
      }).pipe(
        Effect.provideService(
          SponsorRepositoryTag,
          createMockRepoService({
            findById: () => Promise.resolve(mockSponsor),
            isLinkedToTrip: () => Promise.resolve(true),
          }),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(SponsorAlreadyLinkedError);
      }
    });
  });
});
