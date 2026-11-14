import { describe, expect, it } from "vitest";
import { buildImageDiskCacheKey } from "../imageCacheKey";

describe("buildImageDiskCacheKey", () => {
  it("should give the same key to the same object at the same size across launches", () => {
    const first = buildImageDiskCacheKey("challenges/trip-1/photo-123.jpg", null, "feedCard");
    const second = buildImageDiskCacheKey("challenges/trip-1/photo-123.jpg", null, "feedCard");

    expect(first).toBeDefined();
    expect(first).toBe(second);
  });

  it("should keep render sizes apart", () => {
    const small = buildImageDiskCacheKey("rewards/r.jpg", null, "thumbnail");
    const original = buildImageDiskCacheKey("rewards/r.jpg");

    expect(small).not.toBe(original);
  });

  it("should keep different objects apart", () => {
    expect(buildImageDiskCacheKey("rewards/a.jpg")).not.toBe(
      buildImageDiskCacheKey("rewards/b.jpg"),
    );
  });

  // `avatar/<userId>.jpg` is overwritten in place; keying it on the path would show
  // the old face forever after a change.
  it("should not key an avatar on its path when no version is given", () => {
    expect(buildImageDiskCacheKey("avatar/user-1.jpg")).toBeUndefined();
    expect(buildImageDiskCacheKey("avatar/user-1.jpg", "  ", "profileAvatar")).toBeUndefined();
    expect(buildImageDiskCacheKey("/avatar/user-1.jpg")).toBeUndefined();
  });

  it("should key an avatar on its version when one is given", () => {
    const before = buildImageDiskCacheKey("avatar/user-1.jpg", "2026-11-01T10:00:00.000Z");
    const after = buildImageDiskCacheKey("avatar/user-1.jpg", "2026-11-14T10:00:00.000Z");

    expect(before).toBeDefined();
    expect(after).toBeDefined();
    expect(before).not.toBe(after);
  });

  it("should not treat a path that merely contains the word as an avatar", () => {
    expect(buildImageDiskCacheKey("rewards/avatar-frame.png")).toBeDefined();
  });

  it("should return undefined for an empty path", () => {
    expect(buildImageDiskCacheKey("")).toBeUndefined();
    expect(buildImageDiskCacheKey("   ")).toBeUndefined();
  });
});
