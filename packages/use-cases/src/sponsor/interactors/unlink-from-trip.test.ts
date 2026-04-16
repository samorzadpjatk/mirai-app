import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  unlinkSponsorFromTripUseCase,
  type UnlinkSponsorFromTripInput,
  UnlinkSponsorRepositoryError,
} from "./unlink-from-trip";
import { SponsorGatewayTag, type SponsorGateway } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import { Sponsor } from "@mirai-app/domain";

/**
 * Create a mock Sponsor for testing
 */
async function createMockSponsor(
  overrides: Partial<{
    id: string;
    name: string;
    description: string;
    logoPath: string;
  }> = {},
): Promise<Sponsor> {
  const effect = Sponsor.create({
    id: overrides.id ?? "sponsor-123",
    name: overrides.name ?? "Test Sponsor",
    description: overrides.description ?? "Test description",
    logoPath: overrides.logoPath ?? "/logo.png",
  });
  return await Effect.runPromise(effect);
}

/**
 * Mock SponsorGateway for testing
 */
function createMockSponsorGateway(
  options: {
    shouldFailUnlink?: boolean;
  } = {},
): SponsorGateway {
  const sponsorMap = new Map<string, Sponsor>();

  return {
    create: (sponsor: Sponsor) => {
      sponsorMap.set(sponsor.id, sponsor);
      return Effect.succeed(sponsor);
    },

    findById: (id: string) => {
      const sponsor = sponsorMap.get(id);
      return Effect.succeed(sponsor ?? null);
    },

    findAll: () =>
      Effect.succeed({
        items: Array.from(sponsorMap.values()),
        total: sponsorMap.size,
        limit: sponsorMap.size,
        offset: 0,
        hasMore: false,
      }),

    findActiveConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByTripIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    update: (sponsor: Sponsor) => {
      sponsorMap.set(sponsor.id, sponsor);
      return Effect.succeed(sponsor);
    },

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    isLinkedToTrip: () => Effect.succeed(false),

    linkToTrip: () =>
      Effect.succeed({
        id: "link-123",
        tripId: "trip-123",
        sponsorId: "sponsor-123",
        tier: "GOLD",
        benefits: null,
        displayOrder: 1,
        isActive: true,
        linkedAt: new Date(),
        linkedById: "user-123",
      }),

    unlinkFromTrip: (sponsorId: string, tripId: string) => {
      if (options.shouldFailUnlink) {
        return Effect.fail(
          new DatabaseError({
            operation: "unlinkFromTrip",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(void 0);
    },
  };
}

describe("[UNIT] unlinkSponsorFromTripUseCase", () => {
  it("should unlink sponsor from trip successfully", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UnlinkSponsorFromTripInput = {
      sponsorId: "sponsor-456",
      tripId: "trip-789",
    };
    const program = unlinkSponsorFromTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.sponsorId).toBe("sponsor-456");
    expect(result.tripId).toBe("trip-789");
    expect(result.unlinked).toBe(true);
  });

  it("should fail with UnlinkSponsorRepositoryError when unlink fails", async () => {
    const mockGateway = createMockSponsorGateway({ shouldFailUnlink: true });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UnlinkSponsorFromTripInput = {
      sponsorId: "sponsor-abc",
      tripId: "trip-def",
    };
    const program = unlinkSponsorFromTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UnlinkSponsorRepositoryError);
      if (either.left instanceof UnlinkSponsorRepositoryError) {
        expect(either.left.operation).toBe("unlink sponsor from trip");
      }
    }
  });

  it("should return correct output structure on success", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UnlinkSponsorFromTripInput = {
      sponsorId: "sponsor-ghi",
      tripId: "trip-jkl",
    };
    const program = unlinkSponsorFromTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("sponsorId");
    expect(result).toHaveProperty("tripId");
    expect(result).toHaveProperty("unlinked");
    expect(typeof result.sponsorId).toBe("string");
    expect(typeof result.tripId).toBe("string");
    expect(typeof result.unlinked).toBe("boolean");
    expect(result.unlinked).toBe(true);
  });

  it("should handle different sponsor and trip IDs", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const testCases = [
      { sponsorId: "sponsor-a", tripId: "trip-b" },
      { sponsorId: "sponsor-123", tripId: "trip-456" },
      { sponsorId: "uuid-1", tripId: "uuid-2" },
    ];

    for (const testCase of testCases) {
      const program = unlinkSponsorFromTripUseCase(testCase).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.sponsorId).toBe(testCase.sponsorId);
      expect(result.tripId).toBe(testCase.tripId);
      expect(result.unlinked).toBe(true);
    }
  });
});
