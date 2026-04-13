import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { SponsorController } from "../sponsor";
import type { SponsorRepository } from "@mirai-app/use-cases";
import type { Sponsor, SponsorId } from "@mirai-app/domain";

// Valid CUID format IDs for testing
const TEST_SPONSOR_ID = "ckld2qnx30001g4j3yq0p2x1r" as SponsorId;
const TEST_TRIP_ID = "ckld2qnx30002g4j3yq0p2x2s";

// Helper to create a mock Sponsor directly (bypassing Effect-based factory for test setup)
const createMockSponsor = (
  overrides?: Partial<{
    id: SponsorId;
    name: string;
    description: string;
    logoPath: string;
    height: number | null;
    offsetX: number | null;
    offsetY: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>,
): Sponsor => {
  const id = overrides?.id ?? TEST_SPONSOR_ID;
  const name = overrides?.name ?? "Test Sponsor";
  const description = overrides?.description ?? "Test description";
  const logoPath = overrides?.logoPath ?? "/logos/test.png";
  const height = overrides?.height ?? null;
  const offsetX = overrides?.offsetX ?? null;
  const offsetY = overrides?.offsetY ?? null;
  const isActive = overrides?.isActive ?? true;
  const createdAt = overrides?.createdAt ?? new Date("2024-01-01");
  const updatedAt = overrides?.updatedAt ?? new Date("2024-01-01");

  return {
    id,
    name,
    description,
    logoPath,
    height,
    offsetX,
    offsetY,
    isActive,
    createdAt,
    updatedAt,
    hasLogoAdjustments: () => {
      return height !== null || offsetX !== null || offsetY !== null;
    },
    deactivate: () => {
      return createMockSponsor({
        id,
        name,
        description,
        logoPath,
        height,
        offsetX,
        offsetY,
        isActive: false,
        createdAt,
        updatedAt,
      });
    },
    activate: () => {
      return createMockSponsor({
        id,
        name,
        description,
        logoPath,
        height,
        offsetX,
        offsetY,
        isActive: true,
        createdAt,
        updatedAt,
      });
    },
    getDisplayName: () => {
      return isActive ? name : `${name} (Inactive)`;
    },
    isCurrentlyActive: () => {
      return isActive;
    },
    // Note: The real update method is Effect-based, but use cases expect this signature
    // The use case uses the method directly from the entity returned by the repository
    update: (props: {
      name?: string;
      description?: string;
      logoPath?: string;
      height?: number | null;
      offsetX?: number | null;
      offsetY?: number | null;
      isActive?: boolean;
    }) => {
      // Simulate the Effect-based update by returning an Effect that succeeds
      const updated = createMockSponsor({
        id,
        name: props.name ?? name,
        description: props.description ?? description,
        logoPath: props.logoPath ?? logoPath,
        height: props.height !== undefined ? props.height : height,
        offsetX: props.offsetX !== undefined ? props.offsetX : offsetX,
        offsetY: props.offsetY !== undefined ? props.offsetY : offsetY,
        isActive: props.isActive ?? isActive,
        createdAt,
        updatedAt,
      });
      return Effect.succeed(updated);
    },
  } as unknown as Sponsor;
};

describe("[UNIT] SponsorController", () => {
  let controller: SponsorController;
  let mockSponsorRepository: SponsorRepository;

  beforeEach(() => {
    mockSponsorRepository = {
      findById: mock((id: string) =>
        Effect.succeed(
          id === TEST_SPONSOR_ID
            ? createMockSponsor({ id: id as SponsorId })
            : null,
        ),
      ),
      findAll: mock(() => Effect.succeed([createMockSponsor()])),
      findActive: mock(() => Effect.succeed([createMockSponsor()])),
      findByTripId: mock(() => Effect.succeed([createMockSponsor()])),
      create: mock((sponsor: Sponsor) => Effect.succeed(sponsor)),
      update: mock((sponsor: Sponsor) => Effect.succeed(sponsor)),
      delete: mock(() => Effect.succeed(undefined)),
      exists: mock((id: string) => Effect.succeed(id === TEST_SPONSOR_ID)),
      isLinkedToTrip: mock(() => Effect.succeed(false)),
      linkToTrip: mock(() => Effect.succeed(undefined)),
      unlinkFromTrip: mock(() => Effect.succeed(undefined)),
    } as unknown as SponsorRepository;

    controller = new SponsorController(mockSponsorRepository);
  });

  describe("getById", () => {
    it("should return sponsor by ID", async () => {
      const result = await controller.getById({ id: TEST_SPONSOR_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(TEST_SPONSOR_ID);
        expect(result.data.name).toBe("Test Sponsor");
      }
    });

    it("should return error when sponsor not found", async () => {
      mockSponsorRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.getById({ id: TEST_SPONSOR_ID });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error for invalid ID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
    });
  });

  describe("list", () => {
    it("should return all sponsors", async () => {
      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sponsors).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("should return active sponsors only when activeOnly is true", async () => {
      mockSponsorRepository.findActive = mock(() =>
        Effect.succeed([createMockSponsor({ isActive: true })]),
      );

      const result = await controller.list({ activeOnly: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sponsors).toHaveLength(1);
      }
    });
  });

  describe("create", () => {
    it("should create sponsor with valid input", async () => {
      const input = {
        name: "New Sponsor",
        description: "New description",
        logoPath: "/logos/new.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Sponsor");
        expect(result.data.description).toBe("New description");
      }
    });

    it("should return error for missing name", async () => {
      const input = {
        description: "Description without name",
        logoPath: "/logos/test.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });

    it("should return error for empty name", async () => {
      const input = {
        name: "",
        description: "Description",
        logoPath: "/logos/test.png",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update sponsor", async () => {
      // Create a mock with update method that returns Effect
      const mockWithUpdate = createMockSponsor({ id: TEST_SPONSOR_ID });

      mockSponsorRepository.findById = mock((id: string) =>
        Effect.succeed(id === TEST_SPONSOR_ID ? mockWithUpdate : null),
      );

      mockSponsorRepository.update = mock((sponsor: Sponsor) =>
        Effect.succeed(
          createMockSponsor({
            id: sponsor.id,
            name: "Updated Name",
            description: sponsor.description,
            logoPath: sponsor.logoPath,
            height: sponsor.height,
            offsetX: sponsor.offsetX,
            offsetY: sponsor.offsetY,
            isActive: sponsor.isActive,
            createdAt: sponsor.createdAt,
            updatedAt: sponsor.updatedAt,
          }),
        ),
      );

      const input = {
        sponsorId: TEST_SPONSOR_ID,
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Updated Name");
      }
    });

    it("should return error when sponsor not found", async () => {
      mockSponsorRepository.findById = mock(() => Effect.succeed(null));

      const input = {
        sponsorId: "ckld2qnx30004g4j3yq0p2x4u" as SponsorId,
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete sponsor", async () => {
      mockSponsorRepository.findById = mock((id: string) =>
        Effect.succeed(
          id === TEST_SPONSOR_ID
            ? createMockSponsor({ id: id as SponsorId })
            : null,
        ),
      );

      const result = await controller.delete({ id: TEST_SPONSOR_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when sponsor not found", async () => {
      mockSponsorRepository.findById = mock(() => Effect.succeed(null));

      const result = await controller.delete({
        id: "ckld2qnx30004g4j3yq0p2x4u" as SponsorId,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("linkToTrip", () => {
    it("should link sponsor to trip", async () => {
      mockSponsorRepository.findById = mock((id: string) =>
        Effect.succeed(
          id === TEST_SPONSOR_ID
            ? createMockSponsor({ id: id as SponsorId })
            : null,
        ),
      );

      const input = {
        sponsorId: TEST_SPONSOR_ID,
        tripId: TEST_TRIP_ID,
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.linked).toBe(true);
        expect(result.data.sponsorId).toBe(TEST_SPONSOR_ID);
        expect(result.data.tripId).toBe(TEST_TRIP_ID);
      }
    });

    it("should return error when sponsor not found", async () => {
      mockSponsorRepository.findById = mock(() => Effect.succeed(null));

      const input = {
        sponsorId: "ckld2qnx30004g4j3yq0p2x4u" as SponsorId,
        tripId: TEST_TRIP_ID,
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(false);
    });
  });

  describe("unlinkFromTrip", () => {
    it("should unlink sponsor from trip", async () => {
      mockSponsorRepository.findById = mock((id: string) =>
        Effect.succeed(
          id === TEST_SPONSOR_ID
            ? createMockSponsor({ id: id as SponsorId })
            : null,
        ),
      );
      mockSponsorRepository.isLinkedToTrip = mock(() => Effect.succeed(true));

      const input = {
        sponsorId: TEST_SPONSOR_ID,
        tripId: TEST_TRIP_ID,
      };

      const result = await controller.unlinkFromTrip(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unlinked).toBe(true);
        expect(result.data.sponsorId).toBe(TEST_SPONSOR_ID);
        expect(result.data.tripId).toBe(TEST_TRIP_ID);
      }
    });

    it("should succeed even when sponsor not found (idempotent unlink)", async () => {
      // The unlink use case doesn't check if sponsor exists - it's idempotent
      // If sponsor doesn't exist, the unlink operation is a no-op but still succeeds
      mockSponsorRepository.findById = mock(() => Effect.succeed(null));

      const input = {
        sponsorId: "ckld2qnx30004g4j3yq0p2x4u" as SponsorId,
        tripId: TEST_TRIP_ID,
      };

      const result = await controller.unlinkFromTrip(input);

      // The use case succeeds because unlink is idempotent
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unlinked).toBe(true);
      }
    });
  });

  describe("getByTripId", () => {
    it("should return sponsors for trip", async () => {
      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        const sponsor = result.data[0];
        if (sponsor) {
          expect(sponsor.name).toBe("Test Sponsor");
        }
      }
    });

    it("should return empty array when no sponsors for trip", async () => {
      mockSponsorRepository.findByTripId = mock(() => Effect.succeed([]));

      const result = await controller.getByTripId({ tripId: TEST_TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
