import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runSeed } from "../seed";
import type { TripConfig } from "../types";

vi.mock("../config/env", () => ({
  env: {
    databaseUrl: "postgresql://localhost:5432/test",
    supabaseUrl: "http://localhost:8000",
    supabaseServiceRoleKey: "test-key",
    publicBucket: "files-public",
    imageBucket: "image",
    videoBucket: "video",
  },
}));

vi.mock("../storage", () => ({
  ensureBuckets: vi.fn().mockResolvedValue(undefined),
  ensurePlaceholderImage: vi.fn().mockResolvedValue(undefined),
  uploadAssets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../auth", () => ({
  loadAuthUsers: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("../tripConfigs", () => ({
  loadTripConfigs: vi.fn(),
}));

vi.mock("../trips", () => ({
  seedTrip: vi.fn(),
}));

vi.mock("../sponsors", () => ({
  loadSponsorConfigs: vi.fn().mockResolvedValue([]),
  seedSponsors: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../rewards", () => ({
  loadRewardConfigs: vi.fn().mockResolvedValue([]),
  seedRewards: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../tripInfo", () => ({
  loadTripInfoConfig: vi.fn().mockResolvedValue({}),
  seedTripInfo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../utils/fs", () => ({
  dirExists: vi.fn(),
}));

vi.mock("../constants", () => ({
  assetsRoot: "/test/assets",
}));

const mockTrips: TripConfig[] = [
  {
    key: "test-trip",
    name: "Test Trip",
    description: "A test trip",
    startDate: "2026-01-01",
    endDate: "2026-01-10",
    users: "users/test.csv",
  },
];

describe("runSeed", () => {
  const originalArgv = process.argv;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { dirExists } = await import("../utils/fs");
    (dirExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValue(mockTrips);
    const { seedTrip } = await import("../trips");
    (seedTrip as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "trip-123", name: "Test Trip" });
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it("should seed development environment by default", async () => {
    process.argv = [];
    const { ensureBuckets, ensurePlaceholderImage, uploadAssets } = await import("../storage");
    const { loadAuthUsers } = await import("../auth");
    const { loadTripConfigs } = await import("../tripConfigs");
    
    await runSeed();

    expect(ensureBuckets).toHaveBeenCalled();
    expect(ensurePlaceholderImage).toHaveBeenCalledWith("dev");
    expect(uploadAssets).toHaveBeenCalledWith("dev");
    expect(loadAuthUsers).toHaveBeenCalled();
    expect(loadTripConfigs).toHaveBeenCalled();
  });

  it("should seed production environment with --prod flag", async () => {
    process.argv = ["--prod"];
    const { ensurePlaceholderImage, uploadAssets } = await import("../storage");
    
    await runSeed();

    expect(ensurePlaceholderImage).toHaveBeenCalledWith("prod");
    expect(uploadAssets).toHaveBeenCalledWith("prod");
  });

  it("should throw error if assets directory does not exist", async () => {
    const { dirExists } = await import("../utils/fs");
    (dirExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    process.argv = [];

    await expect(runSeed()).rejects.toThrow("Missing assets directory for environment");
  });

  it("should seed each trip from config", async () => {
    process.argv = [];
    const { seedTrip } = await import("../trips");
    
    await runSeed();

    expect(seedTrip).toHaveBeenCalledWith(
      expect.objectContaining({ key: "test-trip" }),
      "users/test.csv",
      expect.stringContaining("dev"),
      expect.any(Map)
    );
  });

  it("should skip sponsors if trip seeding fails", async () => {
    const { seedTrip } = await import("../trips");
    (seedTrip as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { seedSponsors } = await import("../sponsors");
    process.argv = [];

    await runSeed();

    expect(seedSponsors).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("✗ Failed to seed trip:")
    );
  });

  it("should handle sponsor seeding errors gracefully", async () => {
    const tripWithSponsors: TripConfig = { ...mockTrips[0], sponsors: "sponsors/test.yaml" };
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValueOnce([tripWithSponsors]);
    const { seedSponsors } = await import("../sponsors");
    (seedSponsors as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Sponsor error"));
    process.argv = [];

    await runSeed();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to seed sponsors"),
      expect.any(Error)
    );
  });

  it("should handle reward seeding errors gracefully", async () => {
    const tripWithRewards: TripConfig = { ...mockTrips[0], rewards: "rewards/test.yaml" };
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValueOnce([tripWithRewards]);
    const { seedRewards } = await import("../rewards");
    (seedRewards as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Reward error"));
    process.argv = [];

    await runSeed();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to seed rewards"),
      expect.any(Error)
    );
  });

  it("should handle trip info seeding errors gracefully", async () => {
    const tripWithInfo: TripConfig = { ...mockTrips[0], info: "info/test.yaml" };
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValueOnce([tripWithInfo]);
    const { seedTripInfo } = await import("../tripInfo");
    (seedTripInfo as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Info error"));
    process.argv = [];

    await runSeed();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to seed trip info"),
      expect.any(Error)
    );
  });

  it("should seed multiple trips", async () => {
    const multipleTrips: TripConfig[] = [
      { key: "trip-1", name: "Trip 1", description: "Desc 1", startDate: "2026-01-01", endDate: "2026-01-05", users: "users/trip1.csv" },
      { key: "trip-2", name: "Trip 2", description: "Desc 2", startDate: "2026-02-01", endDate: "2026-02-05", users: "users/trip2.csv" },
    ];
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValueOnce(multipleTrips);
    const { seedTrip } = await import("../trips");
    (seedTrip as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "trip-1", name: "Trip 1" })
      .mockResolvedValueOnce({ id: "trip-2", name: "Trip 2" });
    process.argv = [];

    await runSeed();

    expect(seedTrip).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith("Seeding completed");
  });

  it("should continue seeding even if one trip fails", async () => {
    const multipleTrips: TripConfig[] = [
      { key: "trip-1", name: "Trip 1", description: "Desc 1", startDate: "2026-01-01", endDate: "2026-01-05", users: "users/trip1.csv" },
      { key: "trip-2", name: "Trip 2", description: "Desc 2", startDate: "2026-02-01", endDate: "2026-02-05", users: "users/trip2.csv" },
    ];
    const { loadTripConfigs } = await import("../tripConfigs");
    (loadTripConfigs as ReturnType<typeof vi.fn>).mockResolvedValueOnce(multipleTrips);
    const { seedTrip } = await import("../trips");
    (seedTrip as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "trip-2", name: "Trip 2" });
    process.argv = [];

    await runSeed();

    expect(seedTrip).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenCalledWith("Seeding completed");
  });

  it("should skip rewards seeding if no rewards config", async () => {
    process.argv = [];
    const { loadRewardConfigs, seedRewards } = await import("../rewards");

    await runSeed();

    expect(loadRewardConfigs).not.toHaveBeenCalled();
    expect(seedRewards).not.toHaveBeenCalled();
  });

  it("should skip trip info seeding if no info config", async () => {
    process.argv = [];
    const { loadTripInfoConfig, seedTripInfo } = await import("../tripInfo");

    await runSeed();

    expect(loadTripInfoConfig).not.toHaveBeenCalled();
    expect(seedTripInfo).not.toHaveBeenCalled();
  });
});
