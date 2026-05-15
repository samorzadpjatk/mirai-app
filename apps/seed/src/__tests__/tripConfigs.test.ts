import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadTripConfigs } from "../tripConfigs";

const mockListFilesRecursive = vi.fn();
const mockReadTextFile = vi.fn();
const mockJoinPath = vi.fn((...parts: string[]) => parts.join("/"));

vi.mock("../utils/fs", () => ({
  listFilesRecursive: (...args: unknown[]) => mockListFilesRecursive(...args) as Promise<string[]>,
  readTextFile: (path: string) => mockReadTextFile(path) as Promise<string>,
}));

vi.mock("../utils/path", () => ({
  joinPath: (...args: string[]) => mockJoinPath(...args),
}));

describe("tripConfigs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadTripConfigs", () => {
    it("should return empty array when no config files exist", async () => {
      mockListFilesRecursive.mockResolvedValue([]);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toEqual([]);
      expect(mockJoinPath).toHaveBeenCalledWith("/test/assets/dev", "config");
    });

    it("should load single YAML config file", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/trip.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: test-trip
name: Test Trip
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        key: "test-trip",
        name: "Test Trip",
        startDate: "2026-01-01",
        endDate: "2026-01-10",
        users: "users/test.csv",
      });
    });

    it("should load multiple YAML config files", async () => {
      mockListFilesRecursive.mockResolvedValue([
        "/test/assets/dev/config/trip1.yaml",
        "/test/assets/dev/config/trip2.yml",
      ]);
      mockReadTextFile.mockResolvedValueOnce(`
key: trip-1
name: Trip One
startDate: 2026-01-01
endDate: 2026-01-10
users: users/trip1.csv
`).mockResolvedValueOnce(`
key: trip-2
name: Trip Two
startDate: 2026-02-01
endDate: 2026-02-10
users: users/trip2.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(2);
      expect(result[0]!.key).toBe("trip-1");
      expect(result[1]!.key).toBe("trip-2");
    });

    it("should filter out non-YAML files", async () => {
      mockListFilesRecursive.mockResolvedValue([
        "/test/assets/dev/config/trip.yaml",
        "/test/assets/dev/config/readme.txt",
        "/test/assets/dev/config/data.json",
        "/test/assets/dev/config/other.yml",
      ]);
      mockReadTextFile.mockResolvedValueOnce(`
key: yaml-trip
name: YAML Trip
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
`).mockResolvedValueOnce(`
key: yml-trip
name: YML Trip
startDate: 2026-02-01
endDate: 2026-02-10
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(2);
      expect(result[0]!.key).toBe("yaml-trip");
      expect(result[1]!.key).toBe("yml-trip");
    });

    it("should skip invalid configs missing required fields", async () => {
      mockListFilesRecursive.mockResolvedValue([
        "/test/assets/dev/config/valid.yaml",
        "/test/assets/dev/config/invalid.yaml",
      ]);
      mockReadTextFile.mockResolvedValueOnce(`
key: valid-trip
name: Valid Trip
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
`).mockResolvedValueOnce(`
key: invalid-trip
name: Invalid Trip
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(1);
      expect(result[0]!.key).toBe("valid-trip");
    });

    it("should skip configs missing key", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/no-key.yaml"]);
      mockReadTextFile.mockResolvedValue(`
name: No Key Trip
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should skip configs missing name", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/no-name.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: no-name-trip
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should skip configs missing startDate", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/no-start.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: no-start-trip
name: No Start Trip
endDate: 2026-01-10
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should skip configs missing endDate", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/no-end.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: no-end-trip
name: No End Trip
startDate: 2026-01-01
users: users/test.csv
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should skip configs missing users", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/no-users.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: no-users-trip
name: No Users Trip
startDate: 2026-01-01
endDate: 2026-01-10
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should include optional fields when present", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/full.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: full-trip
name: Full Trip
description: A complete trip configuration
startDate: 2026-01-01
endDate: 2026-01-10
users: users/test.csv
background: images/background.jpg
rewards: rewards/list.yaml
sponsors: sponsors/list.yaml
info: info/details.yaml
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(1);
      expect(result[0]!.description).toBe("A complete trip configuration");
      expect(result[0]!.background).toBe("images/background.jpg");
      expect(result[0]!.rewards).toBe("rewards/list.yaml");
      expect(result[0]!.sponsors).toBe("sponsors/list.yaml");
      expect(result[0]!.info).toBe("info/details.yaml");
    });

    it("should handle empty YAML files", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/empty.yaml"]);
      mockReadTextFile.mockResolvedValue("");

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should handle YAML with null values", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/null.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: null
name: null
startDate: null
endDate: null
users: null
`);

      const result = await loadTripConfigs("/test/assets/dev");

      expect(result).toHaveLength(0);
    });

    it("should handle YAML parsing errors gracefully", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/dev/config/bad.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: [unclosed bracket
name: Bad YAML
`);

      await expect(loadTripConfigs("/test/assets/dev")).rejects.toThrow();
    });

    it("should handle different environments", async () => {
      mockListFilesRecursive.mockResolvedValue(["/test/assets/prod/config/trip.yaml"]);
      mockReadTextFile.mockResolvedValue(`
key: prod-trip
name: Production Trip
startDate: 2026-06-01
endDate: 2026-06-10
users: users/prod.csv
`);

      const result = await loadTripConfigs("/test/assets/prod");

      expect(result[0]!.key).toBe("prod-trip");
      expect(mockJoinPath).toHaveBeenCalledWith("/test/assets/prod", "config");
    });
  });
});
