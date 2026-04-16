import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteSponsorUseCase,
  type DeleteSponsorInput,
  DeleteSponsorNotFoundError,
} from "./delete";
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
  options: {
    shouldFailExists?: boolean;
    shouldFailDelete?: boolean;
  } = {},
): SponsorGateway {
  const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));

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

    delete: (id: string) => {
      if (options.shouldFailDelete) {
        return Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Database error",
          }),
        );
      }
      sponsorMap.delete(id);
      return Effect.succeed(void 0);
    },

    exists: (id: string) => {
      if (options.shouldFailExists) {
        return Effect.fail(
          new DatabaseError({
            operation: "exists",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(sponsorMap.has(id));
    },

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

    unlinkFromTrip: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] deleteSponsorUseCase", () => {
  it("should delete sponsor successfully when sponsor exists", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-456" });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: DeleteSponsorInput = { sponsorId: "sponsor-456" };
    const program = deleteSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("sponsor-456");
    expect(result.deleted).toBe(true);
  });

  it("should fail with DeleteSponsorNotFoundError when sponsor not found", async () => {
    const mockGateway = createMockSponsorGateway([]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: DeleteSponsorInput = { sponsorId: "non-existent" };
    const program = deleteSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteSponsorNotFoundError);
    }
  });

  it("should fail with DatabaseError when exists check fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-789" });
    const mockGateway = createMockSponsorGateway([mockSponsor], {
      shouldFailExists: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: DeleteSponsorInput = { sponsorId: "sponsor-789" };
    const program = deleteSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should fail with DatabaseError when delete operation fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-abc" });
    const mockGateway = createMockSponsorGateway([mockSponsor], {
      shouldFailDelete: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: DeleteSponsorInput = { sponsorId: "sponsor-abc" };
    const program = deleteSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return correct output structure", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-def" });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: DeleteSponsorInput = { sponsorId: "sponsor-def" };
    const program = deleteSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("deleted");
    expect(typeof result.id).toBe("string");
    expect(typeof result.deleted).toBe("boolean");
  });
});
