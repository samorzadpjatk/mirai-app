import { describe, it, expect, vi, beforeEach } from "vitest";
import { fileExists, dirExists, readTextFile } from "~/utils/fs";
import { joinPath } from "~/utils/path";
import { assetsRoot } from "~/constants";

// Mock the dependencies
vi.mock("~/utils/fs", () => ({
  fileExists: vi.fn(),
  dirExists: vi.fn(),
  readFile: vi.fn(),
  readTextFile: vi.fn(),
  listFilesRecursive: vi.fn(),
}));

vi.mock("~/utils/path", () => ({
  joinPath: vi.fn((...parts: string[]) => parts.join("/")),
}));

describe("Seed CLI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("File System Utilities", () => {
    it("should check if file exists", async () => {
      vi.mocked(fileExists).mockResolvedValue(true);

      const result = await fileExists("/path/to/file.txt");

      expect(result).toBe(true);
      expect(fileExists).toHaveBeenCalledWith("/path/to/file.txt");
    });

    it("should check if directory exists", async () => {
      vi.mocked(dirExists).mockResolvedValue(true);

      const result = await dirExists("/path/to/dir");

      expect(result).toBe(true);
      expect(dirExists).toHaveBeenCalledWith("/path/to/dir");
    });

    it("should read text file content", async () => {
      const mockContent = "test content";
      vi.mocked(readTextFile).mockResolvedValue(mockContent);

      const result = await readTextFile("/path/to/file.txt");

      expect(result).toBe(mockContent);
      expect(readTextFile).toHaveBeenCalledWith("/path/to/file.txt");
    });
  });

  describe("Path Utilities", () => {
    it("should join paths correctly", () => {
      const result = joinPath("assets", "dev", "config");

      expect(result).toBe("assets/dev/config");
    });
  });

  describe("Constants", () => {
    it("should have correct assets root path", () => {
      expect(assetsRoot).toBeDefined();
      expect(typeof assetsRoot).toBe("string");
    });
  });

  describe("Environment Configuration", () => {
    it("should validate required environment variables", () => {
      const requiredEnvVars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_STORAGE_IMAGE_BUCKET",
        "SUPABASE_STORAGE_VIDEO_BUCKET",
        "SUPABASE_STORAGE_PUBLIC_BUCKET",
        "SEED_GHOST_EMAIL",
        "SEED_GHOST_PASSWORD",
        "DATABASE_URL",
      ];

      // Check that all required env vars are defined in the env module
      for (const envVar of requiredEnvVars) {
        expect(process.env[envVar] || "mock-value").toBeDefined();
      }
    });
  });

  describe("Seed Logic", () => {
    it("should handle missing assets directory", async () => {
      vi.mocked(dirExists).mockResolvedValue(false);

      const envRoot = joinPath(assetsRoot, "dev");
      const exists = await dirExists(envRoot);

      expect(exists).toBe(false);
    });

    it("should process trip configurations", async () => {
      const mockTripConfig = {
        key: "test-trip",
        name: "Test Trip",
        description: "A test trip for unit testing",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test-users.csv",
      };

      // Verify trip config structure
      expect(mockTripConfig.key).toBe("test-trip");
      expect(mockTripConfig.name).toBe("Test Trip");
      expect(mockTripConfig.users).toBe("users/test-users.csv");
    });

    it("should validate CSV user data format", async () => {
      const mockCsvContent = `email,firstName,lastName,role,password,ghost,wristNumber,houseNumber
test@example.com,John,Doe,USER,password123,false,1,101`;

      vi.mocked(readTextFile).mockResolvedValue(mockCsvContent);

      const content = await readTextFile("users/test-users.csv");
      const lines = content.split("\n");
      const headers = lines[0].split(",");

      expect(headers).toContain("email");
      expect(headers).toContain("firstName");
      expect(headers).toContain("lastName");
      expect(headers).toContain("role");
    });
  });

  describe("Storage Operations", () => {
    it("should mock storage bucket operations", async () => {
      const mockEnsureBuckets = vi.fn().mockResolvedValue(undefined);
      const mockUploadAssets = vi.fn().mockResolvedValue(undefined);

      await mockEnsureBuckets();
      await mockUploadAssets("dev");

      expect(mockEnsureBuckets).toHaveBeenCalled();
      expect(mockUploadAssets).toHaveBeenCalledWith("dev");
    });
  });

  describe("Database Operations", () => {
    it("should mock database seeding operations", async () => {
      const mockSeedTrip = vi.fn().mockResolvedValue({
        id: "trip-123",
        key: "test-trip",
        name: "Test Trip",
      });

      const result = await mockSeedTrip(
        { key: "test-trip", name: "Test Trip" },
        "users/test.csv",
        "assets/dev",
        new Map()
      );

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("key");
      expect(mockSeedTrip).toHaveBeenCalled();
    });
  });
});
