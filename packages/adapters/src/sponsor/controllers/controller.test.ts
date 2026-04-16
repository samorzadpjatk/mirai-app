import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { SponsorController } from "./controller";
import { SponsorGatewayTag, type SponsorGateway } from "@mirai-app/use-cases";
import type { TripSponsorDTO } from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import type { Connection, PageInfo } from "@mirai-app/domain";
import type { PaginatedResult } from "@mirai-app/use-cases";

/**
 * [UNIT] SponsorController Tests
 *
 * Comprehensive tests for the sponsor controller covering:
 * - Input validation for all methods
 * - Successful use case delegation
 * - Error handling from use cases
 * - Edge cases (null values, empty lists, etc.)
 */

// Helper to create a valid CUID
const createCuid = (suffix: string) =>
  `c${"a".repeat(24 - suffix.length)}${suffix}`;

// Sponsor entity interface with methods (matches what use cases expect)
interface MockSponsor {
  id: string;
  name: string;
  description: string;
  logoPath: string;
  height: number | null;
  offsetX: number | null;
  offsetY: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasLogoAdjustments(): boolean;
  update(
    props: Record<string, unknown>,
  ): Effect.Effect<MockSponsor, never, never>;
  activate(): MockSponsor;
  deactivate(): MockSponsor;
  isActiveSponsor(): boolean;
  hasCustomDimensions(): boolean;
  hasCustomPositioning(): boolean;
  getDimensions(): {
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
  };
  updateLogo(logoPath: string): Effect.Effect<MockSponsor, never, never>;
}

// Mock trip sponsor data factory
const createMockTripSponsor = (
  overrides: Partial<TripSponsorDTO> = {},
): TripSponsorDTO => ({
  id: createCuid("tripsponsor1"),
  tripId: createCuid("trip1"),
  sponsorId: createCuid("sponsor1"),
  tier: "GOLD",
  benefits: "Special benefits",
  displayOrder: 1,
  isActive: true,
  linkedAt: new Date("2024-01-01"),
  linkedById: createCuid("user1"),
  ...overrides,
});

// Create mock page info
const createMockPageInfo = (overrides: Partial<PageInfo> = {}): PageInfo => ({
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
  ...overrides,
});

// Create mock paginated result
const createMockPaginatedResult = <T>(items: T[]): PaginatedResult<T> => ({
  items,
  total: items.length,
  limit: 100,
  offset: 0,
  hasMore: false,
});

// Create mock connection
const createMockConnection = <T>(nodes: T[]): Connection<T> => ({
  edges: [],
  nodes,
  pageInfo: createMockPageInfo(),
  totalCount: nodes.length,
});

// Create a mock Sponsor entity with methods
const createMockSponsorEntity = (
  overrides: Partial<MockSponsor> = {},
): MockSponsor => {
  const data = {
    id: createCuid("sponsor1"),
    name: "Test Sponsor",
    description: "Test Description",
    logoPath: "/logos/test.png",
    height: null as number | null,
    offsetX: null as number | null,
    offsetY: null as number | null,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };

  const sponsor: MockSponsor = {
    ...data,
    hasLogoAdjustments: () =>
      data.height !== null || data.offsetX !== null || data.offsetY !== null,
    update: (props: Record<string, unknown>) =>
      Effect.succeed({ ...sponsor, ...props } as MockSponsor),
    activate: () => ({ ...sponsor, isActive: true }),
    deactivate: () => ({ ...sponsor, isActive: false }),
    isActiveSponsor: () => data.isActive,
    hasCustomDimensions: () => data.height !== null,
    hasCustomPositioning: () => data.offsetX !== null || data.offsetY !== null,
    getDimensions: () => ({
      height: data.height,
      offsetX: data.offsetX,
      offsetY: data.offsetY,
    }),
    updateLogo: (logoPath: string) => Effect.succeed({ ...sponsor, logoPath }),
  };

  return sponsor;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSponsorEntityForGateway = (): any => createMockSponsorEntity();

// Create mock gateway layer with extra methods that controller expects
const createMockGatewayLayer = (
  overrides: Record<string, unknown> = {},
): Layer.Layer<unknown> => {
  const mockGateway = {
    create: () => Effect.succeed(createMockSponsorEntityForGateway()),
    findById: () => Effect.succeed(createMockSponsorEntityForGateway()),
    findAll: () =>
      Effect.succeed(
        createMockPaginatedResult([createMockSponsorEntityForGateway()]),
      ),
    update: () => Effect.succeed(createMockSponsorEntityForGateway()),
    delete: () => Effect.succeed(void 0),
    exists: () => Effect.succeed(true),
    linkToTrip: () => Effect.succeed(createMockTripSponsor()),
    unlinkFromTrip: () => Effect.succeed(void 0),
    findActiveConnection: () => Effect.succeed(createMockConnection([])),
    findByTripIdConnection: () => Effect.succeed(createMockConnection([])),
    // Extra methods not in interface but used by controller/use cases
    findByTripId: () => Effect.succeed([createMockSponsorEntityForGateway()]),
    isLinkedToTrip: () => Effect.succeed(false),
    ...overrides,
  };

  return Layer.succeed(
    SponsorGatewayTag,
    mockGateway as SponsorGateway,
  ) as Layer.Layer<unknown>;
};

describe("[UNIT] SponsorController", () => {
  let controller: SponsorController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    mockLayer = createMockGatewayLayer();
    controller = new SponsorController(mockLayer);
  });

  describe("getById", () => {
    it("returns sponsor when valid CUID provided", async () => {
      const result = await controller.getById({ id: createCuid("sponsor1") });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(createCuid("sponsor1"));
        expect(result.data.name).toBe("Test Sponsor");
      }
    });

    it("returns error when invalid CUID format provided", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when null input provided", async () => {
      const result = await controller.getById(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when use case fails", async () => {
      const errorLayer = createMockGatewayLayer({
        findById: () =>
          Effect.fail(
            new DatabaseError({ operation: "findById", message: "DB Error" }),
          ),
      });
      const errorController = new SponsorController(errorLayer);

      const result = await errorController.getById({
        id: createCuid("sponsor1"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("DB Error");
      }
    });
  });

  describe("create", () => {
    it("creates sponsor with valid input", async () => {
      const input = {
        name: "New Sponsor",
        description: "New Description",
        logoPath: "/logos/new.png",
        isActive: true,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Sponsor");
      }
    });

    it("creates sponsor with optional height, offsetX, offsetY", async () => {
      const input = {
        name: "New Sponsor",
        description: "New Description",
        logoPath: "/logos/new.png",
        height: 100,
        offsetX: 10,
        offsetY: 20,
        isActive: true,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });

    it("returns error when name is empty", async () => {
      const input = {
        name: "",
        description: "Description",
        logoPath: "/logo.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when name exceeds 200 characters", async () => {
      const input = {
        name: "a".repeat(201),
        description: "Description",
        logoPath: "/logo.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when description is empty", async () => {
      const input = {
        name: "Valid Name",
        description: "",
        logoPath: "/logo.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when description exceeds 2000 characters", async () => {
      const input = {
        name: "Valid Name",
        description: "a".repeat(2001),
        logoPath: "/logo.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when logoPath is empty", async () => {
      const input = {
        name: "Valid Name",
        description: "Valid Description",
        logoPath: "",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when height is negative", async () => {
      const input = {
        name: "Valid Name",
        description: "Valid Description",
        logoPath: "/logo.png",
        height: -1,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when offsetX is negative", async () => {
      const input = {
        name: "Valid Name",
        description: "Valid Description",
        logoPath: "/logo.png",
        offsetX: -1,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when offsetY is negative", async () => {
      const input = {
        name: "Valid Name",
        description: "Valid Description",
        logoPath: "/logo.png",
        offsetY: -1,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });
  });

  describe("update", () => {
    it("updates sponsor with valid input", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        name: "Updated Name",
        description: "Updated Description",
        logoPath: "/logos/updated.png",
        isActive: false,
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Sponsor");
      }
    });

    it("updates sponsor with partial data", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        name: "Only Name Updated",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });

    it("returns error when sponsorId is invalid", async () => {
      const input = {
        sponsorId: "invalid-id",
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when name exceeds 200 characters", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        name: "a".repeat(201),
      };

      const result = await controller.update(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when use case fails (sponsor not found)", async () => {
      const notFoundLayer = createMockGatewayLayer({
        findById: () => Effect.succeed(null),
      });
      const notFoundController = new SponsorController(notFoundLayer);

      const input = {
        sponsorId: createCuid("sponsor1"),
        name: "Updated Name",
      };

      const result = await notFoundController.update(input);

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("deletes sponsor with valid id", async () => {
      const result = await controller.delete({ id: createCuid("sponsor1") });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
        expect(result.data.id).toBe(createCuid("sponsor1"));
      }
    });

    it("returns error when id is invalid", async () => {
      const result = await controller.delete({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when sponsor not found", async () => {
      const notFoundLayer = createMockGatewayLayer({
        exists: () => Effect.succeed(false),
      });
      const notFoundController = new SponsorController(notFoundLayer);

      const result = await notFoundController.delete({
        id: createCuid("sponsor1"),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
    it("returns list of sponsors", async () => {
      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sponsors).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("returns list with pagination", async () => {
      const result = await controller.list({ limit: 10, offset: 0 });

      expect(result.success).toBe(true);
    });

    it("returns list with activeOnly filter", async () => {
      const result = await controller.list({ activeOnly: true });

      expect(result.success).toBe(true);
    });

    it("returns error when limit is negative", async () => {
      const result = await controller.list({ limit: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when limit exceeds 100", async () => {
      const result = await controller.list({ limit: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when offset is negative", async () => {
      const result = await controller.list({ offset: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns empty list when no sponsors found", async () => {
      const emptyLayer = createMockGatewayLayer({
        findAll: () => Effect.succeed(createMockPaginatedResult([])),
      });
      const emptyController = new SponsorController(emptyLayer);

      const result = await emptyController.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sponsors).toHaveLength(0);
        expect(result.data.total).toBe(0);
      }
    });
  });

  describe("getByTripId", () => {
    it("returns sponsors for valid trip id", async () => {
      const result = await controller.getByTripId({
        tripId: createCuid("trip1"),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.id).toBe(createCuid("sponsor1"));
      }
    });

    it("returns error when tripId is invalid", async () => {
      const result = await controller.getByTripId({ tripId: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns empty list when no sponsors found", async () => {
      const emptyLayer = createMockGatewayLayer({
        findByTripId: () => Effect.succeed([]),
      });
      const emptyController = new SponsorController(emptyLayer);

      const result = await emptyController.getByTripId({
        tripId: createCuid("trip1"),
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("linkToTrip", () => {
    it("links sponsor to trip with valid ids", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        tripId: createCuid("trip1"),
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linked).toBe(true);
        expect(result.data.sponsorId).toBe(createCuid("sponsor1"));
        expect(result.data.tripId).toBe(createCuid("trip1"));
      }
    });

    it("returns error when sponsorId is invalid", async () => {
      const input = {
        sponsorId: "invalid-id",
        tripId: createCuid("trip1"),
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when tripId is invalid", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        tripId: "invalid-id",
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when sponsor not found", async () => {
      const notFoundLayer = createMockGatewayLayer({
        findById: () => Effect.succeed(null),
      });
      const notFoundController = new SponsorController(notFoundLayer);

      const input = {
        sponsorId: createCuid("sponsor1"),
        tripId: createCuid("trip1"),
      };

      const result = await notFoundController.linkToTrip(input);

      expect(result.success).toBe(false);
    });
  });

  describe("unlinkFromTrip", () => {
    it("unlinks sponsor from trip with valid ids", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        tripId: createCuid("trip1"),
      };

      const result = await controller.unlinkFromTrip(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unlinked).toBe(true);
        expect(result.data.sponsorId).toBe(createCuid("sponsor1"));
        expect(result.data.tripId).toBe(createCuid("trip1"));
      }
    });

    it("returns error when sponsorId is invalid", async () => {
      const input = {
        sponsorId: "invalid-id",
        tripId: createCuid("trip1"),
      };

      const result = await controller.unlinkFromTrip(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });

    it("returns error when tripId is invalid", async () => {
      const input = {
        sponsorId: createCuid("sponsor1"),
        tripId: "invalid-id",
      };

      const result = await controller.unlinkFromTrip(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid input");
      }
    });
  });

  describe("getActiveConnection", () => {
    it("returns active sponsors with pagination", async () => {
      const result = await controller.getActiveConnection({
        first: 10,
        after: null,
      });

      expect(result.items).toBeDefined();
      expect(result.hasMore).toBe(false);
    });

    it("returns empty items when gateway fails", async () => {
      const errorLayer = createMockGatewayLayer({
        findActiveConnection: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findActiveConnection",
              message: "DB Error",
            }),
          ),
      });
      const errorController = new SponsorController(errorLayer);

      const result = await errorController.getActiveConnection({
        first: 10,
        after: null,
      });

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it("handles pagination cursor", async () => {
      const mockSponsor = createMockSponsorEntity({
        id: createCuid("sponsor2"),
      });
      const cursorLayer = createMockGatewayLayer({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findActiveConnection: () =>
          Effect.succeed({
            edges: [{ node: mockSponsor, cursor: "cursor1" }],
            nodes: [mockSponsor],
            pageInfo: createMockPageInfo({
              hasNextPage: true,
              startCursor: "cursor1",
              endCursor: "cursor1",
            }),
            totalCount: 1,
          } as any),
      });
      const cursorController = new SponsorController(cursorLayer);

      const result = await cursorController.getActiveConnection({
        first: 10,
        after: { id: createCuid("sponsor1"), createdAt: new Date() },
      });

      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("getByTripIdConnection", () => {
    it("returns trip sponsors with pagination", async () => {
      const result = await controller.getByTripIdConnection({
        tripId: createCuid("trip1"),
        first: 10,
        after: null,
      });

      expect(result.items).toBeDefined();
      expect(result.hasMore).toBe(false);
    });

    it("returns empty items when gateway fails", async () => {
      const errorLayer = createMockGatewayLayer({
        findByTripIdConnection: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findByTripIdConnection",
              message: "DB Error",
            }),
          ),
      });
      const errorController = new SponsorController(errorLayer);

      const result = await errorController.getByTripIdConnection({
        tripId: createCuid("trip1"),
        first: 10,
        after: null,
      });

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it("handles pagination cursor", async () => {
      const mockTripSponsor = createMockTripSponsor({
        id: createCuid("tripsponsor2"),
      });
      const cursorLayer = createMockGatewayLayer({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        findByTripIdConnection: () =>
          Effect.succeed({
            edges: [{ node: mockTripSponsor, cursor: "cursor1" }],
            nodes: [mockTripSponsor],
            pageInfo: createMockPageInfo({
              hasNextPage: true,
              startCursor: "cursor1",
              endCursor: "cursor1",
            }),
            totalCount: 1,
          } as any),
      });
      const cursorController = new SponsorController(cursorLayer);

      const result = await cursorController.getByTripIdConnection({
        tripId: createCuid("trip1"),
        first: 10,
        after: { id: createCuid("tripsponsor1"), createdAt: new Date() },
      });

      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });
  });

  describe("edge cases and error handling", () => {
    it("handles database errors gracefully", async () => {
      const errorLayer = createMockGatewayLayer({
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Connection lost",
            }),
          ),
      });
      const errorController = new SponsorController(errorLayer);

      const result = await errorController.getById({
        id: createCuid("sponsor1"),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Connection lost");
      }
    });

    it("handles unknown errors gracefully", async () => {
      const errorLayer = createMockGatewayLayer({
        findById: () => Effect.fail("Unknown error string"),
      });
      const errorController = new SponsorController(errorLayer);

      const result = await errorController.getById({
        id: createCuid("sponsor1"),
      });

      expect(result.success).toBe(false);
    });

    it("handles null input gracefully", async () => {
      const result = await controller.getById(undefined);

      expect(result.success).toBe(false);
    });

    it("handles undefined properties in input", async () => {
      const input = {
        name: "Valid Name",
        description: "Valid Description",
        logoPath: "/logo.png",
        height: undefined,
        offsetX: undefined,
        offsetY: undefined,
        isActive: undefined,
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
    });
  });
});
