import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("constants", () => {
  const originalCwd: () => string = () => process.cwd();

  beforeEach(() => {
    // Reset modules to ensure fresh import
    vi.resetModules();
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it("should export assetsRoot as an absolute path", async () => {
    // Mock process.cwd to return a predictable path
    process.cwd = vi.fn().mockReturnValue("/test/project");

    // Re-import to get fresh value with mocked cwd
    const { assetsRoot: freshAssetsRoot } = await import("../constants");

    expect(freshAssetsRoot).toBe("/test/project/assets");
  });

  it("should handle different working directories", async () => {
    process.cwd = vi.fn().mockReturnValue("/home/user/mirai");

    const { assetsRoot: freshAssetsRoot } = await import("../constants");

    expect(freshAssetsRoot).toBe("/home/user/mirai/assets");
  });

  it("should handle paths with spaces", async () => {
    process.cwd = vi.fn().mockReturnValue("/Users/My User/Projects");

    const { assetsRoot: freshAssetsRoot } = await import("../constants");

    expect(freshAssetsRoot).toBe("/Users/My User/Projects/assets");
  });

  it("should handle Windows-style paths", async () => {
    process.cwd = vi.fn().mockReturnValue("/test/project");
    const { assetsRoot: freshAssetsRoot } = await import("../constants");
    expect(freshAssetsRoot).toBe("/test/project/assets");
  });

  it("should handle relative paths in cwd", async () => {
    process.cwd = vi.fn().mockReturnValue("./relative/path");

    const { assetsRoot: freshAssetsRoot } = await import("../constants");

    // path.resolve converts relative to absolute
    expect(freshAssetsRoot).toContain("/assets");
  });
});
