import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createSponsorUseCase,
  type CreateSponsorInput,
  CreateSponsorValidationError,
} from "./create";
import { SponsorGatewayTag, type SponsorGateway } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import { Sponsor } from "@mirai-app/domain";

/**
 * Mock SponsorGateway for testing
 */
function createMockSponsorGateway(
  options: {
    shouldFailCreate?: boolean;
  } = {},
): SponsorGateway {
  const sponsorMap = new Map<string, Sponsor>();

  return {
    create: (sponsor: Sponsor) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
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

    unlinkFromTrip: () => Effect.succeed(void 0),
  };
}

describe("[UNIT] createSponsorUseCase", () => {
  it("should create sponsor successfully with valid input", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Test Sponsor",
      description: "A test sponsor description",
      logoPath: "/images/sponsor-logo.png",
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Test Sponsor");
    expect(result.description).toBe("A test sponsor description");
    expect(result.logoPath).toBe("/images/sponsor-logo.png");
    expect(result.id).toBeDefined();
    expect(result.isActive).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should create sponsor with all optional fields", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Full Sponsor",
      description: "Complete sponsor data",
      logoPath: "/images/full-logo.png",
      height: 150,
      offsetX: 10,
      offsetY: 20,
      isActive: false,
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Full Sponsor");
    expect(result.height).toBe(150);
    expect(result.offsetX).toBe(10);
    expect(result.offsetY).toBe(20);
    expect(result.isActive).toBe(false);
  });

  it("should fail with CreateSponsorValidationError when name is empty", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "",
      description: "Description",
      logoPath: "/logo.png",
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
      if (either.left instanceof CreateSponsorValidationError) {
        expect(either.left.message).toContain("name");
      }
    }
  });

  it("should fail with CreateSponsorValidationError when description is empty", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Name",
      description: "",
      logoPath: "/logo.png",
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
    }
  });

  it("should fail with CreateSponsorValidationError when logoPath is empty", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Name",
      description: "Description",
      logoPath: "",
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CreateSponsorValidationError);
    }
  });

  it("should fail with DatabaseError when database error occurs", async () => {
    const mockGateway = createMockSponsorGateway({ shouldFailCreate: true });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Test Sponsor",
      description: "Description",
      logoPath: "/logo.png",
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return all expected output properties", async () => {
    const mockGateway = createMockSponsorGateway();
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: CreateSponsorInput = {
      name: "Complete Sponsor",
      description: "Complete description",
      logoPath: "/images/logo.png",
      height: 100,
      offsetX: 5,
      offsetY: 10,
    };

    const program = createSponsorUseCase(input).pipe(Effect.provide(mockLayer));
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
  });
});
