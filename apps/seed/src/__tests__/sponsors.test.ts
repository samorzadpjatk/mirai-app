import { type MockInstance, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SponsorConfig } from "../types";

// Stub Bun global for test environment
if (typeof (globalThis as { Bun?: unknown }).Bun === "undefined") {
  Object.assign(globalThis, {
    Bun: {
      file: () => ({ text: () => Promise.resolve("") }),
    },
  });
}

const mockBunFileText = vi.fn();

vi.mock("yaml", () => ({
  default: {
    parse: (content: string): unknown[] | null => {
      if (!content.trim()) return null;
      try {
        return JSON.parse(content) as unknown[];
      } catch {
        return [];
      }
    },
  },
}));

const sponsorsTable = { id: { name: "id" } };
const tripSponsorsTable = {
  tripId: { name: "tripId" },
  sponsorId: { name: "sponsorId" },
};

const mockSponsorOnConflict = vi.fn().mockResolvedValue(undefined);
const mockSponsorValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockSponsorOnConflict });

const mockTripSponsorOnConflict = vi.fn().mockResolvedValue(undefined);
const mockTripSponsorValues = vi
  .fn()
  .mockReturnValue({ onConflictDoUpdate: mockTripSponsorOnConflict });

const mockDbInsert = vi.fn((table: unknown) => {
  if (table === sponsorsTable) return { values: mockSponsorValues };
  if (table === tripSponsorsTable) return { values: mockTripSponsorValues };
  throw new Error("Unknown table");
});

describe("sponsors", () => {
  let bunFileSpy: MockInstance<typeof Bun.file>;

  beforeEach(() => {
    vi.resetModules();

    bunFileSpy = vi.spyOn(Bun, "file").mockImplementation(
      () =>
        ({
          text: () => mockBunFileText(),
        }) as BunFile,
    );

    vi.clearAllMocks();
    mockBunFileText.mockReset();

    mockSponsorOnConflict.mockReset().mockResolvedValue(undefined);
    mockTripSponsorOnConflict.mockReset().mockResolvedValue(undefined);

    mockSponsorValues.mockClear().mockReturnValue({ onConflictDoUpdate: mockSponsorOnConflict });
    mockTripSponsorValues
      .mockClear()
      .mockReturnValue({ onConflictDoUpdate: mockTripSponsorOnConflict });
    mockDbInsert.mockClear().mockImplementation((table: unknown) => {
      if (table === sponsorsTable) return { values: mockSponsorValues };
      if (table === tripSponsorsTable) return { values: mockTripSponsorValues };
      throw new Error("Unknown table");
    });

    vi.doMock("@mirai-app/db", () => ({
      sponsors: sponsorsTable,
      tripSponsors: tripSponsorsTable,
      createDb: () => ({ insert: (table: unknown) => mockDbInsert(table) }),
    }));
  });

  afterEach(() => {
    bunFileSpy.mockRestore();
  });

  describe("loadSponsorConfigs", () => {
    it("should load sponsor configs from YAML file", async () => {
      mockBunFileText.mockResolvedValue(
        JSON.stringify([
          {
            id: "sponsor-1",
            name: "Acme Corp",
            description: "A great sponsor",
            logoPath: "images/sponsors/acme.png",
            height: 20,
            offsetX: 5,
            offsetY: 10,
          },
          {
            id: "sponsor-2",
            name: "Tech Inc",
            description: "Technology sponsor",
            logoPath: "images/sponsors/tech.png",
          },
        ]),
      );

      const { loadSponsorConfigs } = await import("../sponsors");
      const result = await loadSponsorConfigs("/test/assets/dev", "sponsors/list.yaml");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "sponsor-1",
        name: "Acme Corp",
        description: "A great sponsor",
        logoPath: "images/sponsors/acme.png",
        height: 20,
        offsetX: 5,
        offsetY: 10,
      });
      expect(result[1]).toMatchObject({
        id: "sponsor-2",
        name: "Tech Inc",
        description: "Technology sponsor",
        logoPath: "images/sponsors/tech.png",
      });
    });

    it("should return empty array for null parsed content", async () => {
      mockBunFileText.mockResolvedValue("");

      const { loadSponsorConfigs } = await import("../sponsors");
      const result = await loadSponsorConfigs("/test/assets/dev", "sponsors/list.yaml");

      expect(result).toEqual([]);
    });

    it("should return empty array for empty YAML", async () => {
      mockBunFileText.mockResolvedValue("[]");

      const { loadSponsorConfigs } = await import("../sponsors");
      const result = await loadSponsorConfigs("/test/assets/dev", "sponsors/list.yaml");

      expect(result).toEqual([]);
    });

    it("should construct correct file path", async () => {
      mockBunFileText.mockResolvedValue("[]");

      const { loadSponsorConfigs } = await import("../sponsors");
      await loadSponsorConfigs("/test/assets/dev", "sponsors/test.yaml");

      expect(bunFileSpy).toHaveBeenCalledWith("/test/assets/dev/sponsors/test.yaml");
    });
  });

  describe("seedSponsors", () => {
    it("should skip if no sponsors configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", []);

      expect(mockDbInsert).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("No sponsors configured, skipping...");

      consoleSpy.mockRestore();
    });

    it("should upsert sponsors", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        {
          id: "sponsor-1",
          name: "Acme Corp",
          description: "A great sponsor",
          logoPath: "images/sponsors/acme.png",
          height: 20,
          offsetX: 5,
          offsetY: 10,
        },
      ];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockDbInsert).toHaveBeenCalledWith(sponsorsTable);
      expect(mockSponsorValues).toHaveBeenCalledWith({
        id: "sponsor-1",
        name: "Acme Corp",
        description: "A great sponsor",
        logoPath: "images/sponsors/acme.png",
        height: 20,
        offsetX: 5,
        offsetY: 10,
        isActive: true,
      });
      expect(mockSponsorOnConflict).toHaveBeenCalledWith({
        target: sponsorsTable.id,
        set: {
          name: "Acme Corp",
          description: "A great sponsor",
          logoPath: "images/sponsors/acme.png",
          height: 20,
          offsetX: 5,
          offsetY: 10,
          isActive: true,
        },
      });

      consoleSpy.mockRestore();
    });

    it("should handle null optional fields", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        {
          id: "sponsor-1",
          name: "Simple Sponsor",
          description: "Simple description",
          logoPath: "images/sponsors/simple.png",
        },
      ];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockSponsorValues).toHaveBeenCalledWith(
        expect.objectContaining({
          height: null,
          offsetX: null,
          offsetY: null,
        }),
      );
      expect(mockSponsorOnConflict).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            height: null,
            offsetX: null,
            offsetY: null,
          }),
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should associate sponsors with trip", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        {
          id: "sponsor-1",
          name: "Acme Corp",
          description: "A great sponsor",
          logoPath: "images/sponsors/acme.png",
        },
      ];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockDbInsert).toHaveBeenCalledWith(tripSponsorsTable);
      expect(mockTripSponsorValues).toHaveBeenCalledWith({
        tripId: "trip-1",
        sponsorId: "sponsor-1",
      });
      expect(mockTripSponsorOnConflict).toHaveBeenCalledWith({
        target: [tripSponsorsTable.tripId, tripSponsorsTable.sponsorId],
        set: {
          tripId: "trip-1",
          sponsorId: "sponsor-1",
        },
      });

      consoleSpy.mockRestore();
    });

    it("should handle multiple sponsors", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        { id: "sponsor-1", name: "Sponsor 1", description: "Desc 1", logoPath: "img1.png" },
        { id: "sponsor-2", name: "Sponsor 2", description: "Desc 2", logoPath: "img2.png" },
        { id: "sponsor-3", name: "Sponsor 3", description: "Desc 3", logoPath: "img3.png" },
      ];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      const sponsorCalls = mockDbInsert.mock.calls.filter(([table]) => table === sponsorsTable);
      const tripSponsorCalls = mockDbInsert.mock.calls.filter(
        ([table]) => table === tripSponsorsTable,
      );
      expect(sponsorCalls).toHaveLength(3);
      expect(tripSponsorCalls).toHaveLength(3);

      consoleSpy.mockRestore();
    });

    it("should throw and log error on database failure", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        { id: "sponsor-1", name: "Sponsor 1", description: "Desc 1", logoPath: "img.png" },
      ];

      mockSponsorOnConflict.mockRejectedValue(new Error("DB Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        /* noop */
      });

      const { seedSponsors } = await import("../sponsors");
      await expect(seedSponsors("db-url", "trip-1", "dev", sponsorConfigs)).rejects.toThrow(
        "DB Error",
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), "✗ Failed to seed sponsors");

      consoleSpy.mockRestore();
    });
  });
});
