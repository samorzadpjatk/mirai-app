import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getSponsorUseCase,
  type GetSponsorInput,
  GetSponsorNotFoundError,
} from "./get";
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
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
    isActive: boolean;
  }> = {},
): Promise<Sponsor> {
  const effect = Sponsor.create({
    id: overrides.id ?? "sponsor-123",
    name: overrides.name ?? "Test Sponsor",
    description: overrides.description ?? "Test description",
    logoPath: overrides.logoPath ?? "/logo.png",
    height: overrides.height,
    offsetX: overrides.offsetX,
    offsetY: overrides.offsetY,
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
    shouldFailFind?: boolean;
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

describe("[UNIT] getSponsorUseCase", () => {
  it("should return sponsor when found by ID", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-456",
      name: "Acme Corp",
      description: "Official sponsor",
      logoPath: "/acme-logo.png",
      height: 120,
      offsetX: 15,
      offsetY: 25,
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "sponsor-456" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("sponsor-456");
    expect(result.name).toBe("Acme Corp");
    expect(result.description).toBe("Official sponsor");
    expect(result.logoPath).toBe("/acme-logo.png");
    expect(result.height).toBe(120);
    expect(result.offsetX).toBe(15);
    expect(result.offsetY).toBe(25);
    expect(result.isActive).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should fail with GetSponsorNotFoundError when sponsor not found", async () => {
    const mockGateway = createMockSponsorGateway([]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "non-existent" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetSponsorNotFoundError);
    }
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const mockGateway = createMockSponsorGateway([], { shouldFailFind: true });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "sponsor-123" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return hasLogoAdjustments as true when height is set", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-logo",
      height: 100,
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "sponsor-logo" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.hasLogoAdjustments).toBe(true);
  });

  it("should return hasLogoAdjustments as false when height is null", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-no-logo",
      height: null,
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "sponsor-no-logo" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.hasLogoAdjustments).toBe(false);
  });

  it("should return all sponsor properties", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-full",
      name: "Full Sponsor",
      description: "Full description",
      logoPath: "/full.png",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: GetSponsorInput = { sponsorId: "sponsor-full" };
    const program = getSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("logoPath");
    expect(result).toHaveProperty("height");
    expect(result).toHaveProperty("offsetX");
    expect(result).toHaveProperty("offsetY");
    expect(result).toHaveProperty("isActive");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
    expect(result).toHaveProperty("hasLogoAdjustments");
  });
});
