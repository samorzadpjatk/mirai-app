import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SponsorConfig } from "../types";

const mockReadTextFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));

vi.mock("../utils/fs", () => ({
  readTextFile: (path: string) => mockReadTextFile(path) as Promise<string>,
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
}));

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

describe("sponsors", () => {
  const mockSponsorUpsert: ReturnType<typeof vi.fn> = vi.fn();
  const mockTripSponsorUpsert: ReturnType<typeof vi.fn> = vi.fn();
  const mockCreateDb = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSponsorUpsert.mockReset();
    mockTripSponsorUpsert.mockReset();
    mockCreateDb.mockReset();
    
    mockCreateDb.mockReturnValue({
      sponsor: { upsert: mockSponsorUpsert },
      tripSponsor: { upsert: mockTripSponsorUpsert },
    });

    vi.doMock("@mirai-app/db", () => ({
      createDb: (...args: unknown[]) => mockCreateDb(...args) as { sponsor: { upsert: typeof mockSponsorUpsert }; tripSponsor: { upsert: typeof mockTripSponsorUpsert } },
    }));
  });

  describe("loadSponsorConfigs", () => {
    it("should load sponsor configs from YAML file", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify([
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
      ]));

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
      mockReadTextFile.mockResolvedValue("");

      const { loadSponsorConfigs } = await import("../sponsors");
      const result = await loadSponsorConfigs("/test/assets/dev", "sponsors/list.yaml");

      expect(result).toEqual([]);
    });

    it("should return empty array for empty YAML", async () => {
      mockReadTextFile.mockResolvedValue("[]");

      const { loadSponsorConfigs } = await import("../sponsors");
      const result = await loadSponsorConfigs("/test/assets/dev", "sponsors/list.yaml");

      expect(result).toEqual([]);
    });

    it("should construct correct file path", async () => {
      mockReadTextFile.mockResolvedValue("[]");

      const { loadSponsorConfigs } = await import("../sponsors");
      await loadSponsorConfigs("/test/assets/dev", "sponsors/test.yaml");

      expect(mockJoinPath).toHaveBeenCalledWith("/test/assets/dev", "sponsors/test.yaml");
    });
  });

  describe("seedSponsors", () => {
    it("should skip if no sponsors configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", []);

      expect(mockSponsorUpsert).not.toHaveBeenCalled();
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockSponsorUpsert).toHaveBeenCalledWith({
        where: { id: "sponsor-1" },
        update: {
          name: "Acme Corp",
          description: "A great sponsor",
          logoPath: "images/sponsors/acme.png",
          height: 20,
          offsetX: 5,
          offsetY: 10,
          isActive: true,
        },
        create: {
          id: "sponsor-1",
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockSponsorUpsert).toHaveBeenCalledWith({
        where: { id: "sponsor-1" },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        update: expect.objectContaining({
          height: null,
          offsetX: null,
          offsetY: null,
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        create: expect.objectContaining({
          height: null,
          offsetX: null,
          offsetY: null,
        }),
      });

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockTripSponsorUpsert).toHaveBeenCalledWith({
        where: {
          tripId_sponsorId: {
            tripId: "trip-1",
            sponsorId: "sponsor-1",
          },
        },
        update: {
          tripId: "trip-1",
          sponsorId: "sponsor-1",
        },
        create: {
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("db-url", "trip-1", "dev", sponsorConfigs);

      expect(mockSponsorUpsert).toHaveBeenCalledTimes(3);
      expect(mockTripSponsorUpsert).toHaveBeenCalledTimes(3);

      consoleSpy.mockRestore();
    });

    it("should throw and log error on database failure", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        { id: "sponsor-1", name: "Sponsor 1", description: "Desc 1", logoPath: "img.png" },
      ];

      mockSponsorUpsert.mockRejectedValue(new Error("DB Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await expect(seedSponsors("db-url", "trip-1", "dev", sponsorConfigs)).rejects.toThrow("DB Error");
      expect(consoleSpy).toHaveBeenCalledWith("✗ Failed to seed sponsors:", expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("should create database client with provided URL", async () => {
      const sponsorConfigs: SponsorConfig[] = [
        { id: "sponsor-1", name: "Sponsor 1", description: "Desc 1", logoPath: "img.png" },
      ];

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedSponsors } = await import("../sponsors");
      await seedSponsors("postgresql://test:5432/db", "trip-1", "dev", sponsorConfigs);

      expect(mockCreateDb).toHaveBeenCalledWith("postgresql://test:5432/db");

      consoleSpy.mockRestore();
    });
  });
});
