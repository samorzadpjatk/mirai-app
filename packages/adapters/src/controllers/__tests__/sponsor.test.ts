import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SponsorController } from "../sponsor";
import type { SponsorRepository } from "@mirai-app/use-cases";
import type { Sponsor, SponsorId } from "@mirai-app/domain";

// Mock Sponsor domain object
const createMockSponsor = (overrides?: Partial<Sponsor>): Sponsor =>
  ({
    id: "sponsor-123" as SponsorId,
    name: "Test Sponsor",
    description: "Test description",
    logo: null,
    website: null,
    tier: "BRONZE",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }) as Sponsor;

describe("[UNIT] SponsorController", () => {
  let controller: SponsorController;
  let mockSponsorRepository: SponsorRepository;

  beforeEach(() => {
    mockSponsorRepository = {
      findById: mock(() => Promise.resolve(createMockSponsor())),
      findAll: mock(() => Promise.resolve([createMockSponsor()])),
      create: mock((sponsor: Sponsor) => Promise.resolve(sponsor)),
      update: mock((sponsor: Sponsor) => Promise.resolve(sponsor)),
      delete: mock(() => Promise.resolve()),
      findByTripId: mock(() => Promise.resolve([createMockSponsor()])),
      linkToTrip: mock(() => Promise.resolve()),
      unlinkFromTrip: mock(() => Promise.resolve()),
    } as unknown as SponsorRepository;

    controller = new SponsorController(mockSponsorRepository);
  });

  describe("getById", () => {
    it("should return sponsor by ID", async () => {
      const result = await controller.getById({ id: "sponsor-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("sponsor-123");
        expect(result.data.name).toBe("Test Sponsor");
      }
    });

    it("should return error when sponsor not found", async () => {
      mockSponsorRepository.findById = mock(() => Promise.resolve(null));

      const result = await controller.getById({ id: "sponsor-123" });

      expect(result.success).toBe(false);
    });
  });

  describe("getAll", () => {
    it("should return all sponsors", async () => {
      const result = await controller.getAll({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });

  describe("create", () => {
    it("should create sponsor with valid input", async () => {
      const input = {
        name: "New Sponsor",
        tier: "GOLD",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Sponsor");
        expect(result.data.tier).toBe("GOLD");
      }
    });

    it("should return error for invalid tier", async () => {
      const input = {
        name: "Test",
        tier: "INVALID",
      };

      const result = await controller.create(input);

      expect(result.success).toBe(false);
    });
  });

  describe("update", () => {
    it("should update sponsor", async () => {
      const input = {
        sponsorId: "sponsor-123",
        name: "Updated Name",
      };

      const result = await controller.update(input);

      expect(result.success).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete sponsor", async () => {
      const result = await controller.delete({ id: "sponsor-123" });

      expect(result.success).toBe(true);
    });
  });

  describe("linkToTrip", () => {
    it("should link sponsor to trip", async () => {
      const input = {
        sponsorId: "sponsor-123",
        tripId: "trip-123",
      };

      const result = await controller.linkToTrip(input);

      expect(result.success).toBe(true);
    });
  });

  describe("unlinkFromTrip", () => {
    it("should unlink sponsor from trip", async () => {
      const input = {
        sponsorId: "sponsor-123",
        tripId: "trip-123",
      };

      const result = await controller.unlinkFromTrip(input);

      expect(result.success).toBe(true);
    });
  });

  describe("getByTripId", () => {
    it("should return sponsors for trip", async () => {
      const result = await controller.getByTripId({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });
});
