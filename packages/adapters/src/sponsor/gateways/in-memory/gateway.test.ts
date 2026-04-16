import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemorySponsorGateway } from "./gateway";
import type { SponsorDTO, TripSponsorDTO } from "@mirai-app/use-cases";
import { SponsorId } from "@mirai-app/domain";
import { decodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

describe("[UNIT] InMemorySponsorGateway", () => {
  let gateway: InMemorySponsorGateway;

  const createSponsorId = (id: string) => SponsorId.unsafeCreate(id);

  const createMockSponsor = (
    id: string,
    createdAt: Date,
    overrides: Partial<SponsorDTO> = {},
  ): SponsorDTO => ({
    id,
    name: overrides.name ?? `Sponsor ${id}`,
    description: overrides.description ?? null,
    logoUrl: overrides.logoUrl ?? null,
    websiteUrl: overrides.websiteUrl ?? null,
    contactEmail: overrides.contactEmail ?? null,
    contactPhone: overrides.contactPhone ?? null,
    createdAt,
    updatedAt: createdAt,
  });

  beforeEach(() => {
    gateway = new InMemorySponsorGateway();
  });

  describe("CRUD Operations", () => {
    it("creates a sponsor", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());

      const result = await Effect.runPromise(gateway.create(sponsor));

      expect(result.id).toBe("sponsor-001");
      expect(result.name).toBe("Sponsor sponsor-001");
    });

    it("finds sponsor by id", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      const result = await Effect.runPromise(
        gateway.findById(createSponsorId("sponsor-001")),
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe("sponsor-001");
    });

    it("returns null when sponsor not found", async () => {
      const result = await Effect.runPromise(
        gateway.findById(createSponsorId("nonexistent")),
      );
      expect(result).toBeNull();
    });

    it("updates a sponsor", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      const updated: SponsorDTO = { ...sponsor, name: "Updated Sponsor" };
      const result = await Effect.runPromise(gateway.update(updated));

      expect(result.name).toBe("Updated Sponsor");

      const found = await Effect.runPromise(
        gateway.findById(createSponsorId("sponsor-001")),
      );
      expect(found?.name).toBe("Updated Sponsor");
    });

    it("deletes a sponsor", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      await Effect.runPromise(gateway.delete(createSponsorId("sponsor-001")));

      const result = await Effect.runPromise(
        gateway.findById(createSponsorId("sponsor-001")),
      );
      expect(result).toBeNull();
    });

    it("checks if sponsor exists", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      const exists = await Effect.runPromise(
        gateway.exists(createSponsorId("sponsor-001")),
      );
      const notExists = await Effect.runPromise(
        gateway.exists(createSponsorId("nonexistent")),
      );

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe("Pagination", () => {
    it("returns all sponsors with pagination", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, new Date()),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findAll({ limit: 10, offset: 5 }),
      );

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(5);
    });

    it("returns all items when no limit specified", async () => {
      const sponsors = [
        createMockSponsor("sponsor-001", new Date()),
        createMockSponsor("sponsor-002", new Date()),
      ];
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(gateway.findAll());

      expect(result.items).toHaveLength(2);
      expect(result.limit).toBe(2);
      expect(result.offset).toBe(0);
    });
  });

  describe("Trip Linking", () => {
    it("links sponsor to trip", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      const result = await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );

      expect(result.tripId).toBe("trip-001");
      expect(result.sponsorId).toBe("sponsor-001");
      expect(result.tier).toBe("GOLD");
      expect(result.isActive).toBe(true);
      expect(result.linkedAt).toBeInstanceOf(Date);
    });

    it("returns existing link when already linked", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));

      const first = await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );
      const second = await Effect.runPromise(
        gateway.linkToTrip(
          "trip-001",
          createSponsorId("sponsor-001"),
          "SILVER",
        ),
      );

      expect(second.id).toBe(first.id);
      expect(second.tier).toBe("GOLD");
    });

    it("unlinks sponsor from trip", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );

      await Effect.runPromise(
        gateway.unlinkFromTrip("trip-001", createSponsorId("sponsor-001")),
      );

      const tripSponsors = await Effect.runPromise(
        gateway.findByTripId("trip-001"),
      );
      expect(tripSponsors).toHaveLength(0);
    });

    it("finds sponsors by trip id", async () => {
      const sponsor1 = createMockSponsor("sponsor-001", new Date());
      const sponsor2 = createMockSponsor("sponsor-002", new Date());
      const sponsor3 = createMockSponsor("sponsor-003", new Date());
      await Effect.runPromise(gateway.seed([sponsor1, sponsor2, sponsor3]));

      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );
      await Effect.runPromise(
        gateway.linkToTrip(
          "trip-001",
          createSponsorId("sponsor-002"),
          "SILVER",
        ),
      );
      await Effect.runPromise(
        gateway.linkToTrip(
          "trip-002",
          createSponsorId("sponsor-003"),
          "BRONZE",
        ),
      );

      const result = await Effect.runPromise(gateway.findByTripId("trip-001"));

      expect(result).toHaveLength(2);
      expect(result.some((ts) => ts.sponsorId === "sponsor-001")).toBe(true);
      expect(result.some((ts) => ts.sponsorId === "sponsor-002")).toBe(true);
    });

    it("includes sponsor data when available", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date(), {
        name: "Acme Corp",
      });
      await Effect.runPromise(gateway.create(sponsor));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );

      const result = await Effect.runPromise(gateway.findByTripId("trip-001"));

      expect(result[0]?.sponsor).not.toBeUndefined();
      expect(result[0]?.sponsor?.name).toBe("Acme Corp");
    });
  });

  describe("Delete with Trip Links", () => {
    it("removes trip links when sponsor is deleted", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );
      await Effect.runPromise(
        gateway.linkToTrip(
          "trip-002",
          createSponsorId("sponsor-001"),
          "SILVER",
        ),
      );

      await Effect.runPromise(gateway.delete(createSponsorId("sponsor-001")));

      const trip1Sponsors = await Effect.runPromise(
        gateway.findByTripId("trip-001"),
      );
      const trip2Sponsors = await Effect.runPromise(
        gateway.findByTripId("trip-002"),
      );

      expect(trip1Sponsors).toHaveLength(0);
      expect(trip2Sponsors).toHaveLength(0);
    });
  });

  describe("Connection Pagination (findActiveConnection)", () => {
    it("returns empty connection when no sponsors", async () => {
      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it("returns paginated results with hasNextPage", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(
          `sponsor-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).not.toBeNull();
      expect(result.pageInfo.endCursor).not.toBeNull();
    });

    it("sorts by createdAt ascending", async () => {
      const sponsors = [
        createMockSponsor("sponsor-001", new Date(2024, 0, 3)),
        createMockSponsor("sponsor-002", new Date(2024, 0, 1)),
        createMockSponsor("sponsor-003", new Date(2024, 0, 2)),
      ];
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      expect(result.nodes[0]?.id).toBe("sponsor-002");
      expect(result.nodes[1]?.id).toBe("sponsor-003");
      expect(result.nodes[2]?.id).toBe("sponsor-001");
    });

    it("returns subsequent page using cursor", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(
          `sponsor-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const firstPage = await Effect.runPromise(
        gateway.findActiveConnection({ first: 10 }),
      );

      // Decode the cursor string to cursor data before passing to next query
      const decodedCursor = decodeCursor(firstPage.pageInfo.endCursor!);
      expect(decodedCursor).not.toBeNull();

      const secondPage = await Effect.runPromise(
        gateway.findActiveConnection({
          first: 10,
          after: decodedCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it("returns hasNextPage=false on last page", async () => {
      const sponsors = Array.from({ length: 15 }, (_, i) =>
        createMockSponsor(
          `sponsor-${String(i).padStart(3, "0")}`,
          new Date(2024, 0, i + 1),
        ),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      const result = await Effect.runPromise(
        gateway.findActiveConnection({ first: 20 }),
      );

      expect(result.edges).toHaveLength(15);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });

  describe("Connection Pagination (findByTripIdConnection)", () => {
    it("returns empty connection when no trip sponsors", async () => {
      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(0);
      expect(result.nodes).toHaveLength(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it("returns paginated trip sponsors with hasNextPage", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, new Date()),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      for (let i = 0; i < 25; i++) {
        await Effect.runPromise(
          gateway.linkToTrip(
            "trip-001",
            createSponsorId(`sponsor-${String(i).padStart(3, "0")}`),
            "GOLD",
          ),
        );
      }

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { first: 10 }),
      );

      expect(result.edges).toHaveLength(10);
      expect(result.nodes).toHaveLength(10);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it("sorts trip sponsors by linkedAt ascending", async () => {
      const sponsor1 = createMockSponsor("sponsor-001", new Date());
      const sponsor2 = createMockSponsor("sponsor-002", new Date());
      const sponsor3 = createMockSponsor("sponsor-003", new Date());
      await Effect.runPromise(gateway.seed([sponsor1, sponsor2, sponsor3]));

      await new Promise((resolve) => setTimeout(resolve, 10));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-002"), "GOLD"),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      await Effect.runPromise(
        gateway.linkToTrip(
          "trip-001",
          createSponsorId("sponsor-001"),
          "SILVER",
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      await Effect.runPromise(
        gateway.linkToTrip(
          "trip-001",
          createSponsorId("sponsor-003"),
          "BRONZE",
        ),
      );

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { first: 10 }),
      );

      expect(result.nodes[0]?.sponsorId).toBe("sponsor-002");
      expect(result.nodes[1]?.sponsorId).toBe("sponsor-001");
      expect(result.nodes[2]?.sponsorId).toBe("sponsor-003");
    });

    it("includes sponsor data in trip sponsor connection", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date(), {
        name: "Acme Corp",
      });
      await Effect.runPromise(gateway.create(sponsor));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );

      const result = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { first: 10 }),
      );

      expect(result.nodes[0]?.sponsor).not.toBeUndefined();
      expect(result.nodes[0]?.sponsor?.name).toBe("Acme Corp");
    });

    it("supports cursor pagination for trip sponsors", async () => {
      const sponsors = Array.from({ length: 25 }, (_, i) =>
        createMockSponsor(`sponsor-${String(i).padStart(3, "0")}`, new Date()),
      );
      await Effect.runPromise(gateway.seed(sponsors));

      for (const sponsor of sponsors) {
        await new Promise((resolve) => setTimeout(resolve, 1));
        await Effect.runPromise(
          gateway.linkToTrip("trip-001", createSponsorId(sponsor.id), "GOLD"),
        );
      }

      const firstPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", { first: 10 }),
      );

      // Decode the cursor string to cursor data before passing to next query
      const decodedCursor = decodeCursor(firstPage.pageInfo.endCursor!);
      expect(decodedCursor).not.toBeNull();

      const secondPage = await Effect.runPromise(
        gateway.findByTripIdConnection("trip-001", {
          first: 10,
          after: decodedCursor,
        }),
      );

      expect(secondPage.edges).toHaveLength(10);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe("Reset", () => {
    it("clears all sponsors and trip links on reset", async () => {
      const sponsor = createMockSponsor("sponsor-001", new Date());
      await Effect.runPromise(gateway.create(sponsor));
      await Effect.runPromise(
        gateway.linkToTrip("trip-001", createSponsorId("sponsor-001"), "GOLD"),
      );

      await Effect.runPromise(gateway.reset());

      const foundSponsor = await Effect.runPromise(
        gateway.findById(createSponsorId("sponsor-001")),
      );
      const tripSponsors = await Effect.runPromise(
        gateway.findByTripId("trip-001"),
      );

      expect(foundSponsor).toBeNull();
      expect(tripSponsors).toHaveLength(0);
    });
  });
});

/**
 * Summary:
 *
 * This test suite covers the InMemorySponsorGateway implementation with:
 *
 * - CRUD Operations: create, findById, update, delete, exists
 * - Pagination: findAll with limit/offset
 * - Trip Linking:
 *   - linkToTrip (creates TripSponsorDTO, handles duplicate links)
 *   - unlinkFromTrip (removes link)
 *   - findByTripId (includes sponsor data)
 * - Delete with Trip Links: delete removes sponsor and all associated trip links
 * - Connection Pagination (Relay spec compliant):
 *   - findActiveConnection: all sponsors sorted by createdAt ASC
 *   - findByTripIdConnection: trip sponsors sorted by linkedAt ASC
 *   - Cursor-based pagination with hasNextPage, hasPreviousPage
 *   - Edge cursors with id and createdAt/linkedAt encoding
 *   - Sponsor data included in trip sponsor nodes
 * - Reset: clears sponsors, tripLinks map, and tripSponsorData map
 *
 * Total test cases: 25+
 * All tests use beforeEach to ensure clean state between runs.
 */
