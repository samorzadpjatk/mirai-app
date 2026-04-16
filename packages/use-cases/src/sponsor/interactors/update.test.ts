import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateSponsorUseCase,
  type UpdateSponsorInput,
  UpdateSponsorNotFoundError,
  UpdateSponsorValidationError,
} from "./update";
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
    shouldFailUpdate?: boolean;
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
      if (options.shouldFailUpdate) {
        return Effect.fail(
          new DatabaseError({
            operation: "update",
            message: "Database error",
          }),
        );
      }
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

describe("[UNIT] updateSponsorUseCase", () => {
  it("should update sponsor name successfully", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-456",
      name: "Old Name",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-456",
      name: "New Name",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("New Name");
    expect(result.id).toBe("sponsor-456");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should update sponsor description successfully", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-789",
      description: "Old Description",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-789",
      description: "New Description",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.description).toBe("New Description");
  });

  it("should update sponsor logoPath successfully", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-abc",
      logoPath: "/old-logo.png",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-abc",
      logoPath: "/new-logo.png",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.logoPath).toBe("/new-logo.png");
  });

  it("should update sponsor height successfully", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-def" });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-def",
      height: 200,
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.height).toBe(200);
  });

  it("should update sponsor offsetX and offsetY successfully", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-ghi" });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-ghi",
      offsetX: 30,
      offsetY: 40,
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.offsetX).toBe(30);
    expect(result.offsetY).toBe(40);
  });

  it("should update sponsor isActive status", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-jkl",
      isActive: true,
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-jkl",
      isActive: false,
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.isActive).toBe(false);
  });

  it("should update multiple fields at once", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-mno",
      name: "Old",
      description: "Old Desc",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-mno",
      name: "New",
      description: "New Desc",
      logoPath: "/new.png",
      height: 150,
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("New");
    expect(result.description).toBe("New Desc");
    expect(result.logoPath).toBe("/new.png");
    expect(result.height).toBe(150);
  });

  it("should fail with UpdateSponsorNotFoundError when sponsor not found", async () => {
    const mockGateway = createMockSponsorGateway([]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "non-existent",
      name: "New Name",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSponsorNotFoundError);
    }
  });

  it("should fail with UpdateSponsorValidationError when name is empty", async () => {
    const mockSponsor = await createMockSponsor({
      id: "sponsor-pqr",
      name: "Valid",
    });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-pqr",
      name: "",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UpdateSponsorValidationError);
      if (either.left instanceof UpdateSponsorValidationError) {
        expect(either.left.message).toContain("name");
      }
    }
  });

  it("should fail with DatabaseError when findById fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-stu" });
    const mockGateway = createMockSponsorGateway([mockSponsor], {
      shouldFailFind: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-stu",
      name: "New Name",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should fail with DatabaseError when update fails", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-vwx" });
    const mockGateway = createMockSponsorGateway([mockSponsor], {
      shouldFailUpdate: true,
    });
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-vwx",
      name: "New Name",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should return all expected output properties", async () => {
    const mockSponsor = await createMockSponsor({ id: "sponsor-yz" });
    const mockGateway = createMockSponsorGateway([mockSponsor]);
    const mockLayer = Layer.succeed(SponsorGatewayTag, mockGateway);

    const input: UpdateSponsorInput = {
      sponsorId: "sponsor-yz",
      name: "Updated",
    };
    const program = updateSponsorUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("logoPath");
    expect(result).toHaveProperty("height");
    expect(result).toHaveProperty("offsetX");
    expect(result).toHaveProperty("offsetY");
    expect(result).toHaveProperty("isActive");
    expect(result).toHaveProperty("updatedAt");
  });
});
