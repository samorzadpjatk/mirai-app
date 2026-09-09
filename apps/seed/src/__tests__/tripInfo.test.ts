import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadTripInfoConfig, seedTripInfo } from "../tripInfo";
import type { TripInfoConfig } from "../types";

const mockReadTextFile = vi.fn();
const mockReadFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

const mockTripResourceLinkDeleteMany = vi.fn();
const mockTripResourceLinkCreate = vi.fn();
const mockTripResourceFileDeleteMany = vi.fn();
const mockTripResourceFileCreate = vi.fn();
const mockTripResourceTextDeleteMany = vi.fn();
const mockTripResourceTextCreate = vi.fn();
const mockTripResourceIconDeleteMany = vi.fn();
const mockTripResourceIconCreate = vi.fn();
const mockTripInsuranceDeleteMany = vi.fn();
const mockTripInsuranceCreate = vi.fn();
const mockTripInsuranceStepDeleteMany = vi.fn();
const mockTripInsuranceStepCreate = vi.fn();
const mockSelectFromWhere = vi.fn();

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
        upload: (path: string, file: unknown, options: object) =>
          mockUpload(bucket, path, file, options) as Promise<{ error: { message: string } | null }>,
        getPublicUrl: (path: string) =>
          mockGetPublicUrl(bucket, path) as { data: { publicUrl: string } },
      }),
    },
  },
}));

vi.mock("../config/env", () => ({
  env: {
    publicBucket: "files-public",
    imageBucket: "images",
    videoBucket: "videos",
  },
}));

vi.mock("../constants", () => ({
  assetsRoot: "/test/assets",
}));

vi.mock("@mirai-app/db", () => ({
  tripResourceLinks: { __table: "tripResourceLinks", tripId: { name: "tripId" } },
  tripResourceFiles: { __table: "tripResourceFiles", tripId: { name: "tripId" } },
  tripResourceTexts: { __table: "tripResourceTexts", tripId: { name: "tripId" } },
  tripResourceIcons: { __table: "tripResourceIcons", tripId: { name: "tripId" } },
  tripInsurances: { __table: "tripInsurances", tripId: { name: "tripId" }, id: { name: "id" } },
  tripInsuranceSteps: { __table: "tripInsuranceSteps", insuranceId: { name: "insuranceId" } },
}));

vi.mock("../config/db", () => ({
  db: {
    delete: (table: { __table?: string }) => ({
      where: (condition: unknown) => {
        if (table?.__table === "tripResourceLinks") {
          return mockTripResourceLinkDeleteMany(condition);
        } else if (table?.__table === "tripResourceFiles") {
          return mockTripResourceFileDeleteMany(condition);
        } else if (table?.__table === "tripResourceTexts") {
          return mockTripResourceTextDeleteMany(condition);
        } else if (table?.__table === "tripResourceIcons") {
          return mockTripResourceIconDeleteMany(condition);
        } else if (table?.__table === "tripInsurances") {
          return mockTripInsuranceDeleteMany(condition);
        } else if (table?.__table === "tripInsuranceSteps") {
          return mockTripInsuranceStepDeleteMany(condition);
        }
        return Promise.resolve();
      },
    }),
    insert: (table: { __table?: string }) => ({
      values: (data: Record<string, unknown>) => {
        const thenable = {
          returning: () => {
            if (table?.__table === "tripInsurances") {
              mockTripInsuranceCreate(data);
              return Promise.resolve([{ id: "ins-1", ...data }]);
            }
            return Promise.resolve([]);
          },
          then: (
            onFulfilled: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => {
            if (table?.__table === "tripResourceLinks") {
              mockTripResourceLinkCreate(data);
            } else if (table?.__table === "tripResourceFiles") {
              mockTripResourceFileCreate(data);
            } else if (table?.__table === "tripResourceTexts") {
              mockTripResourceTextCreate(data);
            } else if (table?.__table === "tripResourceIcons") {
              mockTripResourceIconCreate(data);
            } else if (table?.__table === "tripInsuranceSteps") {
              mockTripInsuranceStepCreate(data);
            }
            return Promise.resolve().then(onFulfilled, onRejected);
          },
        };
        return thenable;
      },
    }),
    select: () => ({
      from: () => ({
        where: () => mockSelectFromWhere(),
      }),
    }),
  },
}));

describe("tripInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://cdn.example.com/file.pdf" } });
    mockSelectFromWhere.mockResolvedValue([]);
  });

  describe("loadTripInfoConfig", () => {
    it("should load trip info config from YAML file", async () => {
      mockReadTextFile.mockResolvedValue(
        JSON.stringify({
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
        }),
      );

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
    it("should skip if no resources configured", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", { resources: [] });

      expect(mockTripResourceLinkCreate).not.toHaveBeenCalled();
      expect(mockTripResourceFileCreate).not.toHaveBeenCalled();
      expect(mockTripResourceTextCreate).not.toHaveBeenCalled();
      expect(mockTripResourceIconCreate).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("No trip info configured, skipping...");

      consoleSpy.mockRestore();
    });

    it("should delete existing resources before creating new ones", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "hero_image", label: "Hero", sortOrder: 0 }],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceLinkDeleteMany).toHaveBeenCalledWith(expect.anything());
      expect(mockTripResourceFileDeleteMany).toHaveBeenCalledWith(expect.anything());
      expect(mockTripResourceTextDeleteMany).toHaveBeenCalledWith(expect.anything());
      expect(mockTripResourceIconDeleteMany).toHaveBeenCalledWith(expect.anything());

      consoleSpy.mockRestore();
    });

    it("should write every part of a resource to the table that can store it", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceLinkCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Hero Image",
        type: "hero_image",
        url: "https://example.com/hero.jpg",
        description: "Main hero image",
        sortOrder: 0,
      });
      // Regression: the file used to be dropped because the link branch won.
      expect(mockTripResourceFileCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Hero Image",
        type: "hero_image",
        storagePath: "images/hero.jpg",
        fileName: "hero",
        publicUrl: "",
        sortOrder: 0,
      });
      expect(mockTripResourceTextCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Hero Image",
        type: "hero_image",
        value: "hero-value",
        sortOrder: 0,
      });
      expect(mockTripResourceIconCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Hero Image",
        type: "hero_image",
        iconName: "image",
        sortOrder: 0,
      });

      consoleSpy.mockRestore();
    });

    it("should keep an uploaded public file as a file row instead of a bare link", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: "https://cdn.example.com/infopack.pdf" },
      });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "infopack",
            label: "Infopack",
            storagePath: "public/integral/infopack.pdf",
            fileName: "infopack",
            iconName: "book",
            sortOrder: 4,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      // The resolved public URL used to route the resource into the links table,
      // which lost the storagePath the app needs to download the file.
      expect(mockTripResourceFileCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Infopack",
        type: "infopack",
        storagePath: "files-public/integral/infopack.pdf",
        fileName: "infopack",
        publicUrl: "https://cdn.example.com/infopack.pdf",
        sortOrder: 4,
      });
      expect(mockTripResourceLinkCreate).not.toHaveBeenCalled();
      expect(mockTripResourceIconCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Infopack",
        type: "infopack",
        iconName: "book",
        sortOrder: 4,
      });

      consoleSpy.mockRestore();
    });

    it("should store the bucket-qualified reference, not the asset path", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "infopack",
            label: "Przewodnik uczestnika",
            storagePath: "public/integral/guide.pdf",
            fileName: "guide",
            sortOrder: 3,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      // Regression: `public/` is a Supabase object prefix, not a bucket, so the
      // backend resolved a `public/…` reference to nothing and every download
      // of the seeded infopack failed with "Unsupported storage reference".
      const fileRow = mockTripResourceFileCreate.mock.calls[0]?.[0] as { storagePath: string };
      expect(fileRow.storagePath).toBe("files-public/integral/guide.pdf");
      expect(fileRow.storagePath.startsWith("public/")).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should not double the prefix when the config already names the bucket", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "infopack",
            label: "Przewodnik uczestnika",
            storagePath: "files-public/integral/guide.pdf",
            sortOrder: 3,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockReadFile).toHaveBeenCalledWith("/test/assets/dev/public/integral/guide.pdf");
      expect(mockUpload).toHaveBeenCalledWith("files-public", "integral/guide.pdf", mockFile, {
        upsert: true,
      });
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining("Unknown storage path"));
      expect(mockTripResourceFileCreate).toHaveBeenCalledWith(
        expect.objectContaining({ storagePath: "files-public/integral/guide.pdf" }),
      );

      warnSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it("should leave an image reference alone because the directory is the bucket", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);
      mockUpload.mockResolvedValue({ error: null });

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "map_bg_image",
            label: "Kacze Stawy",
            storagePath: "images/trips/integral/kacze-stawy.png",
            sortOrder: 1,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockUpload).toHaveBeenCalledWith(
        "images",
        "trips/integral/kacze-stawy.png",
        mockFile,
        { upsert: true },
      );
      expect(mockTripResourceFileCreate).toHaveBeenCalledWith(
        expect.objectContaining({ storagePath: "images/trips/integral/kacze-stawy.png" }),
      );

      consoleSpy.mockRestore();
    });

    it("should keep the icon of a link resource", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "whatsapp",
            label: "Załoga",
            url: "https://chat.whatsapp.com/example",
            iconName: "chatbubble",
            sortOrder: 5,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceLinkCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Załoga",
        type: "whatsapp",
        url: "https://chat.whatsapp.com/example",
        description: "",
        sortOrder: 5,
      });
      expect(mockTripResourceIconCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "Załoga",
        type: "whatsapp",
        iconName: "chatbubble",
        sortOrder: 5,
      });

      consoleSpy.mockRestore();
    });

    it("should keep the description of a text resource that has no url", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "sos",
            label: "SOS",
            description: "W razie wypadku dzwoń na 112.",
            value: "112",
            iconName: "alert-circle",
            sortOrder: 6,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceLinkCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "SOS",
        type: "sos",
        url: "",
        description: "W razie wypadku dzwoń na 112.",
        sortOrder: 6,
      });
      expect(mockTripResourceTextCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "SOS",
        type: "sos",
        value: "112",
        sortOrder: 6,
      });
      expect(mockTripResourceIconCreate).toHaveBeenCalledWith({
        tripId: "trip-1",
        label: "SOS",
        type: "sos",
        iconName: "alert-circle",
        sortOrder: 6,
      });

      consoleSpy.mockRestore();
    });

    it("should give every row of one resource the same type, label and sortOrder", async () => {
      const mockFile = { stream: () => ({}) };
      mockReadFile.mockReturnValue(mockFile);

      const infoConfig: TripInfoConfig = {
        resources: [
          {
            type: "pdf_map",
            label: "Mapa PDF",
            storagePath: "images/map.png",
            iconName: "document-text",
            sortOrder: 3,
          },
        ],
      };

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      const identity = { type: "pdf_map", label: "Mapa PDF", sortOrder: 3 };
      expect(mockTripResourceFileCreate).toHaveBeenCalledWith(expect.objectContaining(identity));
      expect(mockTripResourceIconCreate).toHaveBeenCalledWith(expect.objectContaining(identity));

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripResourceLinkCreate).not.toHaveBeenCalled();
      expect(mockTripResourceFileCreate).not.toHaveBeenCalled();
      expect(mockTripResourceTextCreate).not.toHaveBeenCalled();
      expect(mockTripResourceIconCreate).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("nothing to store"));

      warnSpy.mockRestore();
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockReadFile).toHaveBeenCalledWith("/test/assets/dev/public/maps/map.pdf");
      expect(mockUpload).toHaveBeenCalledWith("files-public", "maps/map.pdf", mockFile, {
        upsert: true,
      });

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockUpload).toHaveBeenCalledWith("images", "hero.jpg", mockFile, { upsert: true });

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to upload file"));

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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.stringContaining("✗ Failed to process file"),
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(warnSpy).toHaveBeenCalledWith("✗ Unknown storage path format: unknown/path/file.txt");

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

      mockSelectFromWhere.mockResolvedValue([{ id: "ins-1" }]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripInsuranceStepDeleteMany).toHaveBeenCalledWith(expect.anything());
      expect(mockTripInsuranceDeleteMany).toHaveBeenCalledWith(expect.anything());

      expect(mockTripInsuranceCreate).toHaveBeenCalledWith({
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
      });

      expect(mockTripInsuranceStepCreate).toHaveBeenCalledWith({
        insuranceId: "ins-1",
        stepNumber: 1,
        title: "Step 1",
        text: "Call emergency",
        requiredInfo: ["name", "date"],
        exampleCall: "Hello, I need help",
        additionalText: "More info",
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

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      await seedTripInfo("db-url", "trip-1", "dev", infoConfig);

      expect(mockTripInsuranceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          hospitalName: null,
          hospitalAddress: null,
          hospitalDistance: null,
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should throw and log error on database failure", async () => {
      const infoConfig: TripInfoConfig = {
        resources: [{ type: "simple", label: "Simple", sortOrder: 0 }],
      };

      mockTripResourceLinkDeleteMany.mockRejectedValue(new Error("DB Error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      await expect(seedTripInfo("db-url", "trip-1", "dev", infoConfig)).rejects.toThrow("DB Error");
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), "✗ Failed to seed trip info");

      consoleSpy.mockRestore();
    });
  });
});
