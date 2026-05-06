import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTripInfoConfig, seedTripInfo } from "../tripInfo";
import type { TripInfoConfig } from "../types";

const mockReadTextFile = vi.fn();
const mockReadFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));
const mockCreateDb: ReturnType<typeof vi.fn> = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("../utils/fs", () => ({
  readTextFile: (path: string) => mockReadTextFile(path) as Promise<string>,
  readFile: (path: string) => mockReadFile(path) as { stream: () => unknown },
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
}));

vi.mock("yaml", () => ({
  default: {
    parse: (content: string): TripInfoConfig => {
      if (!content.trim()) return { resources: [] };
      try {
        return JSON.parse(content) as TripInfoConfig;
      } catch {
        return { resources: [] };
      }
    },
  },
}));

vi.mock("../config/supabase", () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: unknown, options: object) => mockUpload(bucket, path, file, options) as Promise<{ error: { message: string } | null }>,
        getPublicUrl: (path: string) => mockGetPublicUrl(bucket, path) as { data: { publicUrl: string } },
      }),
    },
  },
}));

vi.mock("../config/env", () => ({
  env: {
    publicBucket: "files-public",
    imageBucket: "image",
    videoBucket: "video",
  },
}));

vi.mock("../constants", () => ({
  assetsRoot: "/test/assets",
}));

vi.mock("@mirai-app/db", () => ({
  createDb: (...args: unknown[]) => mockCreateDb(...args) as { tripResource: { create: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }; tripInsurance: { create: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }; tripInsuranceStep: { create: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> } },
}));

describe("tripInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.pdf" } });
  });

  describe("loadTripInfoConfig", () => {
    it("should load trip info config from YAML file", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify({
        resources: [
          { type: "hero_image", label: "Hero Image", sortOrder: 0 },
          { type: "map", label: "Map", url: "https://example.com/map", sortOrder: 1 },
        ],
        insurance: {
          label: "Insurance",
          phoneNumber: "+123",
          phoneDisplay: "+1 23",
          policyNumber: "POL123",
          contractNumber: "CTR456",
          providerName: "Provider",
          steps: [],
        },
      }));

      const result = await loadTripInfoConfig("/test/assets/dev", "info/trip.yaml");

      expect(result.resources).toHaveLength(2);
      expect(result.resources[0]!.type).toBe("hero_image");
      expect(result.insurance?.label).toBe("Insurance");
    });

    it("should return default structure for null parsed content", async () => {
      mockReadTextFile.mockResolvedValue("");

      const result = await loadTripInfoConfig("/test/assets/dev", "info/trip.yaml");

      expect(result).toEqual({ resources: [] });
    });

    it("should construct correct file path", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify({ resources: [] }));

      await loadTripInfoConfig("/test/assets/dev", "info/test.yaml");

      expect(mockJoinPath).toHaveBeenCalledWith("/test/assets/dev", "info/test.yaml");
    });
  });

  describe("seedTripInfo", () => {
    const mockTripResourceCreate = vi.fn();
    const mockTripResourceDeleteMany = vi.fn();
    const mockTripInsuranceCreate: ReturnType<typeof vi.fn> = vi.fn();
    const mockTripInsuranceDeleteMany = vi.fn();
    const mockTripInsuranceStepDeleteMany = vi.fn();
    const mockTripInsuranceStepCreate = vi.fn();

    beforeEach(() => {
      mockCreateDb.mockReturnValue({
        tripResource: {
          create: mockTripResourceCreate,
          deleteMany: mockTripResourceDeleteMany,
        },
        tripInsurance: {
          create: mockTripInsuranceCreate,
          deleteMany: mockTripInsuranceDeleteMany,
        },
        tripInsuranceStep: {
          create: mockTripInsuranceStepCreate,
          deleteMany: mockTripInsuranceStepDeleteMany,
        },
      });
    });

    it("should skip if no resources configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", { resources: [] });

      expect(mockTripResourceCreate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("No trip info configured, skipping...");

      consoleSpy.mockRestore();
    });

    it("should delete existing resources before creating new ones", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "hero_image", label: "Hero", sortOrder: 0 }],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceDeleteMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1" },
      });

      consoleSpy.mockRestore();
    });

    it("should create resources with correct data", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "hero_image",
            label: "Hero Image",
            description: "Main hero image",
            url: "https://example.com/hero.jpg",
            storagePath: "images/hero.jpg",
            fileName: "hero",
            iconName: "image",
            value: "hero-value",
            sortOrder: 0,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceCreate).toHaveBeenCalledWith({
        data: {
          tripId: "trip-1",
          type: "hero_image",
          label: "Hero Image",
          description: "Main hero image",
          url: "https://example.com/hero.jpg",
          storagePath: "images/hero.jpg",
          fileName: "hero",
          iconName: "image",
          value: "hero-value",
          sortOrder: 0,
        },
      });

      consoleSpy.mockRestore();
    });

    it("should handle resources with null/undefined optional fields", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "simple",
            label: "Simple Resource",
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceCreate).toHaveBeenCalledWith({
        data: {
          tripId: "trip-1",
          type: "simple",
          label: "Simple Resource",
          description: null,
          url: null,
          storagePath: null,
          fileName: null,
          iconName: null,
          value: null,
          sortOrder: 0,
        },
      });

      consoleSpy.mockRestore();
    });

    it("should upload files to public bucket", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "pdf_map",
            label: "Map PDF",
            storagePath: "public/maps/map.pdf",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockReadFile).toHaveBeenCalledWith("/test/assets/dev/public/maps/map.pdf");
      expect(mockUpload).toHaveBeenCalledWith(
        "files-public",
        "maps/map.pdf",
        mockFile,
        { upsert: true }
      );

      consoleSpy.mockRestore();
    });

    it("should upload files to image bucket", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "hero_image",
            label: "Hero",
            storagePath: "images/hero.jpg",
            sortOrder: 0,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockUpload).toHaveBeenCalledWith(
        "image",
        "hero.jpg",
        mockFile,
        { upsert: true }
      );

      consoleSpy.mockRestore();
    });

    it("should get public URL for public bucket uploads", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "infopack",
            label: "Infopack",
            storagePath: "public/infopack.pdf",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockGetPublicUrl).toHaveBeenCalledWith("files-public", "infopack.pdf");

      consoleSpy.mockRestore();
    });

    it("should handle upload errors gracefully", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "pdf_map",
            label: "Map",
            storagePath: "public/maps/map.pdf",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to upload file")
      );

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should handle file read errors gracefully", async () => {
      mockReadFile.mockImplementation(() => {
        throw new Error("File not found");
      });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "pdf_map",
            label: "Map",
            storagePath: "public/maps/missing.pdf",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to process file"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should warn on unknown storage path format", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "unknown",
            label: "Unknown",
            storagePath: "unknown/path/file.txt",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        "✗ Unknown storage path format: unknown/path/file.txt"
      );

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it("should create insurance with steps", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "simple", label: "Simple", sortOrder: 0 }],
        insurance: {
          label: "Insurance Info",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 234 567 890",
          policyNumber: "POL123",
          contractNumber: "CTR456",
          providerName: "Insurance Co",
          hospitalName: "City Hospital",
          hospitalAddress: "123 Main St",
          hospitalDistance: "5km",
          steps: [
            {
              stepNumber: 1,
              title: "Step 1",
              text: "Call emergency",
              requiredInfo: ["name", "date"],
              exampleCall: "Hello, I need help",
              additionalText: "More info",
            },
          ],
        },
      };

      const createdInsurance = { id: "ins-1" };
      mockTripInsuranceCreate.mockResolvedValue(createdInsurance);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripInsuranceStepDeleteMany).toHaveBeenCalled();
      expect(mockTripInsuranceDeleteMany).toHaveBeenCalledWith({
        where: { tripId: "trip-1" },
      });

      expect(mockTripInsuranceCreate).toHaveBeenCalledWith({
        data: {
          tripId: "trip-1",
          label: "Insurance Info",
          phoneNumber: "+1234567890",
          phoneDisplay: "+1 234 567 890",
          policyNumber: "POL123",
          contractNumber: "CTR456",
          providerName: "Insurance Co",
          hospitalName: "City Hospital",
          hospitalAddress: "123 Main St",
          hospitalDistance: "5km",
        },
      });

      expect(mockTripInsuranceStepCreate).toHaveBeenCalledWith({
        data: {
          insuranceId: "ins-1",
          stepNumber: 1,
          title: "Step 1",
          text: "Call emergency",
          requiredInfo: ["name", "date"],
          exampleCall: "Hello, I need help",
          additionalText: "More info",
        },
      });

      consoleSpy.mockRestore();
    });

    it("should handle insurance without optional fields", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "simple", label: "Simple", sortOrder: 0 }],
        insurance: {
          label: "Basic Insurance",
          phoneNumber: "+123",
          phoneDisplay: "+1 23",
          policyNumber: "POL",
          contractNumber: "CTR",
          providerName: "Provider",
          steps: [],
        },
      };

      mockTripInsuranceCreate.mockResolvedValue({ id: "ins-1" });

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripInsuranceCreate).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          hospitalName: null,
          hospitalAddress: null,
          hospitalDistance: null,
        }),
      });

      consoleSpy.mockRestore();
    });

    it("should throw and log error on database failure", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "simple", label: "Simple", sortOrder: 0 }],
      };

      mockTripResourceDeleteMany.mockRejectedValue(new Error("DB Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* noop */ });

      await expect(seedTripInfo("db-url", "trip-1", "dev", infoConfig)).rejects.toThrow("DB Error");
      expect(consoleSpy).toHaveBeenCalledWith("✗ Failed to seed trip info:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
