import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RewardConfig } from "../types";
import type { SupabaseUser } from "@mirai-app/supabase";

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
    parse: (content: string): unknown[] => {
      if (!content.trim()) return [];
      try {
        return JSON.parse(content) as unknown[];
      } catch {
        return [];
      }
    },
  },
}));

vi.mock("../config/env", () => ({
  env: {
    databaseUrl: "postgresql://localhost:5432/test",
  },
}));

describe("rewards", () => {
  const mockInsertValues: ReturnType<typeof vi.fn> = vi.fn();
  const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
  const mockUserFindFirst: ReturnType<typeof vi.fn> = vi.fn();
  const mockCreateDb = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateDb.mockReturnValue({
      query: {
        users: {
          findFirst: mockUserFindFirst,
        },
      },
      insert: mockInsert,
    });

    vi.doMock("@mirai-app/db", () => ({
      createDb: (...args: unknown[]) => mockCreateDb(...args) as { query: { users: { findFirst: typeof mockUserFindFirst } }; insert: typeof mockInsert },
      users: "mock-users-table",
      rewards: "mock-rewards-table",
    }));
  });

  describe("loadRewardConfigs", () => {
    it("should load reward configs from YAML file", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify([
        { name: "Free Pizza", description: "Get a free pizza", availableQuantity: 10, coinCost: 50 },
        { name: "T-shirt", description: "Cool t-shirt", availableQuantity: 5, coinCost: 100, image: "tshirt.jpg" },
      ]));

      const { loadRewardConfigs } = await import("../rewards");
      const result = await loadRewardConfigs("/test/assets/dev", "rewards/list.yaml");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        name: "Free Pizza",
        description: "Get a free pizza",
        availableQuantity: 10,
        coinCost: 50,
      });
      expect(result[1]).toMatchObject({
        name: "T-shirt",
        description: "Cool t-shirt",
        availableQuantity: 5,
        coinCost: 100,
        image: "tshirt.jpg",
      });
    });

    it("should filter out invalid rewards", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify([
        { name: "Valid Reward", description: "This is valid", availableQuantity: 10, coinCost: 50 },
        { name: "Invalid No Description", availableQuantity: 5, coinCost: 100 },
        { name: "Invalid No Quantity", description: "Missing quantity", coinCost: 100 },
        { name: "Invalid No Cost", description: "Missing cost", availableQuantity: 5 },
      ]));

      const { loadRewardConfigs } = await import("../rewards");
      const result = await loadRewardConfigs("/test/assets/dev", "rewards/list.yaml");

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Valid Reward");
    });

    it("should throw error if parsed content is not an array", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify({ name: "Not an array" }));

      const { loadRewardConfigs } = await import("../rewards");
      await expect(loadRewardConfigs("/test/assets/dev", "rewards/list.yaml")).rejects.toThrow(
        "Rewards config must be an array"
      );
    });

    it("should handle empty YAML file", async () => {
      mockReadTextFile.mockResolvedValue("");

      const { loadRewardConfigs } = await import("../rewards");
      const result = await loadRewardConfigs("/test/assets/dev", "rewards/list.yaml");

      expect(result).toHaveLength(0);
    });

    it("should handle YAML with only invalid entries", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify([
        { name: "", description: "", availableQuantity: "not a number", coinCost: "not a number" },
      ]));

      const { loadRewardConfigs } = await import("../rewards");
      const result = await loadRewardConfigs("/test/assets/dev", "rewards/list.yaml");

      expect(result).toHaveLength(0);
    });

    it("should construct correct file path", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify([
        { name: "Test", description: "Test reward", availableQuantity: 1, coinCost: 10 },
      ]));

      const { loadRewardConfigs } = await import("../rewards");
      await loadRewardConfigs("/test/assets/dev", "rewards/test.yaml");

      expect(mockJoinPath).toHaveBeenCalledWith("/test/assets/dev", "rewards/test.yaml");
    });
  });

  describe("seedRewards", () => {
    it("should create rewards when admin user exists", async () => {
      const mockAdminUser = { id: "admin-1", role: "ADMIN" };
      mockUserFindFirst.mockResolvedValue(mockAdminUser);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward 1", description: "Desc 1", availableQuantity: 10, coinCost: 50 },
        { name: "Reward 2", description: "Desc 2", availableQuantity: 5, coinCost: 100, image: "img.jpg" },
      ];

      const authUsers = new Map<string, SupabaseUser>([["admin@test.com", { id: "auth-1" } as SupabaseUser]]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockInsertValues).toHaveBeenCalledTimes(2);
      expect(mockInsertValues).toHaveBeenNthCalledWith(1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({
          name: "Reward 1",
          description: "Desc 1",
          availableQuantity: 10,
          coinCost: 50,
          image: null,
          tripId: "trip-1",
          createdById: "admin-1",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should prefer admin users over regular users", async () => {
      const mockRegularUser: { id: string; role: string } = { id: "user-1", role: "USER" };
      const mockAdminUser: { id: string; role: string } = { id: "admin-1", role: "ADMIN" };

      mockUserFindFirst
        .mockResolvedValueOnce(mockRegularUser)
        .mockResolvedValueOnce(mockAdminUser);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10 },
      ];

      const authUsers = new Map<string, SupabaseUser>([
        ["user@test.com", { id: "auth-1" } as SupabaseUser],
        ["admin@test.com", { id: "auth-2" } as SupabaseUser],
      ]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockInsertValues).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({
          createdById: "admin-1",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should use moderator users if no admin available", async () => {
      const mockModerator: { id: string; role: string } = { id: "mod-1", role: "MODERATOR" };
      mockUserFindFirst.mockResolvedValue(mockModerator);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10 },
      ];

      const authUsers = new Map<string, SupabaseUser>([["mod@test.com", { id: "auth-1" } as SupabaseUser]]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockInsertValues).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({
          createdById: "mod-1",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should warn and skip if no valid user found", async () => {
      mockUserFindFirst.mockResolvedValue(null);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10 },
      ];

      const authUsers = new Map<string, SupabaseUser>([["user@test.com", { id: "auth-1" } as SupabaseUser]]);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockInsertValues).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("No valid database user found to create rewards");

      consoleSpy.mockRestore();
    });

    it("should handle empty reward configs", async () => {
      const mockUser: { id: string; role: string } = { id: "user-1", role: "USER" };
      mockUserFindFirst.mockResolvedValue(mockUser);

      const authUsers = new Map<string, SupabaseUser>([["user@test.com", { id: "auth-1" } as SupabaseUser]]);

      const { seedRewards } = await import("../rewards");
      await seedRewards([], "trip-1", authUsers);

      expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("should normalize image paths", async () => {
      const mockUser: { id: string; role: string } = { id: "user-1", role: "USER" };
      mockUserFindFirst.mockResolvedValue(mockUser);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10, image: "path/to/image.jpg" },
        { name: "Reward 2", description: "Desc 2", availableQuantity: 1, coinCost: 10, image: "rewards/image.jpg" },
      ];

      const authUsers = new Map<string, SupabaseUser>([["user@test.com", { id: "auth-1" } as SupabaseUser]]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockInsertValues).toHaveBeenNthCalledWith(1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({
          image: "rewards/image.jpg",
        }),
      );

      expect(mockInsertValues).toHaveBeenNthCalledWith(2,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({
          image: "rewards/image.jpg",
        }),
      );

      consoleSpy.mockRestore();
    });

    it("should handle database errors gracefully", async () => {
      const mockUser: { id: string; role: string } = { id: "user-1", role: "USER" };
      mockUserFindFirst.mockResolvedValue(mockUser);
      mockInsertValues.mockRejectedValue(new Error("DB Error"));

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10 },
      ];

      const authUsers = new Map<string, SupabaseUser>([["user@test.com", { id: "auth-1" } as SupabaseUser]]);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create reward"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should skip users that throw errors during lookup", async () => {
      const mockUser: { id: string; role: string } = { id: "user-1", role: "USER" };
      mockUserFindFirst
        .mockRejectedValueOnce(new Error("Lookup error"))
        .mockResolvedValueOnce(mockUser);

      const rewardConfigs: RewardConfig[] = [
        { name: "Reward", description: "Desc", availableQuantity: 1, coinCost: 10 },
      ];

      const authUsers = new Map<string, SupabaseUser>([
        ["bad@test.com", { id: "auth-1" } as SupabaseUser],
        ["good@test.com", { id: "auth-2" } as SupabaseUser],
      ]);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => { /* noop */ });

      const { seedRewards } = await import("../rewards");
      await seedRewards(rewardConfigs, "trip-1", authUsers);

      expect(mockUserFindFirst).toHaveBeenCalledTimes(2);
      expect(mockInsertValues).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
