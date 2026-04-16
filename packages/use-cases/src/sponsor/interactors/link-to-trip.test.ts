import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  linkSponsorToTripUseCase,
  type LinkSponsorToTripInput,
  LinkSponsorNotFoundError,
  SponsorAlreadyLinkedError,
  LinkSponsorRepositoryError,
} from "./link-to-trip";
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
  sponsors: Sponsor[] = [],
  linkedSponsors: Set<string> = new Set(),
  options: {
    shouldFailFind?: boolean;
    shouldFailIsLinked?: boolean;
    shouldFailLink?: boolean;
  } = {},
): SponsorGateway {
  const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));

  return {
    create: (sponsor: Sponsor) => {
      sponsorMap.set(sponsor.id, sponsor);
      return Effect.succeed(sponsor);
    },

    findById: (id: string) => {
      if (options.shouldFailFind) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database error",
          }),
        );
      }
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

    isLinkedToTrip: (sponsorId: string, tripId: string) => {
      if (options.shouldFailIsLinked) {
        return Effect.fail(
          new DatabaseError({
            operation: "isLinkedToTrip",
            message: "Database error",
          }),
        );
      }
      const key = `${sponsorId}:${tripId}`;
      return Effect.succeed(linkedSponsors.has(key));
    },

    linkToTrip: (sponsorId: string, tripId: string) => {
      if (options.shouldFailLink) {
        return Effect.fail(
          new DatabaseError({
            operation: "linkToTrip",
            message: "Database error",
          }),
        );
      }
      const key = `${sponsorId}:${tripId}`;
      linkedSponsors.add(key);
      return Effect.succeed({
        id: `link-${sponsorId}-${tripId}`,
        tripId,
        sponsorId,
        tier: "GOLD",
        benefits: null,
        displayOrder: 1,
        isActive: true,
        linkedAt: new Date(),
        linkedById: "user-123",
      });
    },

    unlinkFromTrip: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] linkSponsorToTripUseCase", () => {
  it("should link sponsor to trip successfully", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-456" });
    const mockGateway = createMockSponsorGateway([mockSponsor], new Set());
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-456",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.sponsorId).toBe("sponsor-456");
    expect(result.tripId).toBe("trip-789");
    expect(result.linked).toBe(true);
  });

  it("should fail with LinkSponsorNotFoundError when sponsor not found", async () => {
    const mockGateway = createMockSponsorGateway([], new Set());
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "non-existent",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LinkSponsorNotFoundError);
      if (either.left instanceof LinkSponsorNotFoundError) {
        expect(either.left.sponsorId).toBe("non-existent");
      }
    }
  });

  it("should fail with SponsorAlreadyLinkedError when already linked", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-linked" });
    const linkedSet = new Set(["sponsor-linked:trip-789"]);
    const mockGateway = createMockSponsorGateway([mockSponsor], linkedSet);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-linked",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(SponsorAlreadyLinkedError);
      if (either.left instanceof SponsorAlreadyLinkedError) {
        expect(either.left.sponsorId).toBe("sponsor-linked");
        expect(either.left.tripId).toBe("trip-789");
      }
    }
  });

  it("should fail with LinkSponsorRepositoryError when findById fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-abc" });
    const mockGateway = createMockSponsorGateway([mockSponsor], new Set(), {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-abc",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LinkSponsorRepositoryError);
      if (either.left instanceof LinkSponsorRepositoryError) {
        expect(either.left.operation).toBe("find sponsor");
      }
    }
  });

  it("should fail with LinkSponsorRepositoryError when isLinkedToTrip fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-def" });
    const mockGateway = createMockSponsorGateway([mockSponsor], new Set(), {
      shouldFailIsLinked: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-def",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LinkSponsorRepositoryError);
      if (either.left instanceof LinkSponsorRepositoryError) {
        expect(either.left.operation).toBe("check if linked");
      }
    }
  });

  it("should fail with LinkSponsorRepositoryError when linkToTrip fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-ghi" });
    const mockGateway = createMockSponsorGateway([mockSponsor], new Set(), {
      shouldFailLink: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-ghi",
      tripId: "trip-789",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(LinkSponsorRepositoryError);
      if (either.left instanceof LinkSponsorRepositoryError) {
        expect(either.left.operation).toBe("link sponsor to trip");
      }
    }
  });

  it("should return correct output structure on success", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-jkl" });
    const mockGateway = createMockSponsorGateway([mockSponsor], new Set());
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: LinkSponsorToTripInput = {
      sponsorId: "sponsor-jkl",
      tripId: "trip-mno",
    };
    const program = linkSponsorToTripUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("sponsorId");
    expect(result).toHaveProperty("tripId");
    expect(result).toHaveProperty("linked");
    expect(typeof result.sponsorId).toBe("string");
    expect(typeof result.tripId).toBe("string");
    expect(typeof result.linked).toBe("boolean");
  });
});
