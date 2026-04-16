import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { listSponsorsUseCase, type ListSponsorsInput } from "./list";
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
    isActive: boolean;
  }> = {},
): Promise<Sponsor> {
  const effect = Sponsor.create({
    id: overrides.id ?? `sponsor-${Math.random().toString(36).substring(7)}`,
    name: overrides.name ?? "Test Sponsor",
    description: overrides.description ?? "Test description",
    logoPath: overrides.logoPath ?? "/logo.png",
    isActive: overrides.isActive ?? true,
  });
  return await Effect.runPromise(effect);
}

/**
 * Mock SponsorGateway for testing
 */
function createMockSponsorGateway(
  sponsors: Sponsor[] = [],
  options: {
    shouldFailFindAll?: boolean;
    shouldFailFindActive?: boolean;
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

    findAll: (opts?: { limit?: number; offset?: number }) => {
      if (options.shouldFailFindAll) {
        return Effect.fail(
          new DatabaseError({
            operation: "findAll",
            message: "Database error",
          }),
        );
      }
      const items = Array.from(sponsorMap.values());
      const limit = opts?.limit ?? items.length;
      const offset = opts?.offset ?? 0;
      const paginated = items.slice(offset, offset + limit);
      return Effect.succeed({
        items: paginated,
        total: items.length,
        limit,
        offset,
        hasMore: offset + limit < items.length,
      });
    },

    findActiveConnection: () => {
      if (options.shouldFailFindActive) {
        return Effect.fail(
          new DatabaseError({
            operation: "findActiveConnection",
            message: "Database error",
          }),
        );
      }
      const activeItems = Array.from(sponsorMap.values()).filter(
        (s) => s.isActive,
      );
      return Effect.succeed({
        edges: activeItems.map((s) => ({
          node: s,
          cursor: { id: s.id, createdAt: s.createdAt.toISOString() },
        })),
        nodes: activeItems,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: activeItems.length,
      });
    },

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

    unlinkFromTrip: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] listSponsorsUseCase", () => {
  it("should return all sponsors with default pagination", async () => {
    const sponsor1 = await createMockSponsor({
      id: "sponsor-1",
      name: "Sponsor 1",
    });
    const sponsor2 = await createMockSponsor({
      id: "sponsor-2",
      name: "Sponsor 2",
    });
    const mockGateway = createMockSponsorGateway([sponsor1, sponsor2]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = {};
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sponsors).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should respect limit parameter", async () => {
    const sponsor1 = await createMockSponsor({ id: "sponsor-1" });
    const sponsor2 = await createMockSponsor({ id: "sponsor-2" });
    const sponsor3 = await createMockSponsor({ id: "sponsor-3" });
    const mockGateway = createMockSponsorGateway([
      sponsor1,
      sponsor2,
      sponsor3,
    ]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = { limit: 2 };
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sponsors).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("should respect offset parameter", async () => {
    const sponsor1 = await createMockSponsor({
      id: "sponsor-1",
      name: "First",
    });
    const sponsor2 = await createMockSponsor({
      id: "sponsor-2",
      name: "Second",
    });
    const mockGateway = createMockSponsorGateway([sponsor1, sponsor2]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = { offset: 1, limit: 10 };
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sponsors).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("should return empty list when no sponsors exist", async () => {
    const mockGateway = createMockSponsorGateway([]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = {};
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sponsors).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should fail with DatabaseError when findAll fails", async () => {
    const sponsor1 = await createMockSponsor({ id: "sponsor-1" });
    const mockGateway = createMockSponsorGateway([sponsor1], {
      shouldFailFindAll: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = {};
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should map sponsors to list items correctly", async () => {
    const sponsor = await createMockSponsor({
      id: "sponsor-map",
      name: "Mapped Sponsor",
      description: "Mapped description",
      logoPath: "/mapped.png",
    });
    const mockGateway = createMockSponsorGateway([sponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: ListSponsorsInput = {};
    const program = listSponsorsUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.sponsors[0]).toHaveProperty("id");
    expect(result.sponsors[0]).toHaveProperty("name");
    expect(result.sponsors[0]).toHaveProperty("description");
    expect(result.sponsors[0]).toHaveProperty("logoPath");
    expect(result.sponsors[0]).toHaveProperty("height");
    expect(result.sponsors[0]).toHaveProperty("offsetX");
    expect(result.sponsors[0]).toHaveProperty("offsetY");
    expect(result.sponsors[0]).toHaveProperty("isActive");
    expect(result.sponsors[0]).toHaveProperty("createdAt");
  });
});
