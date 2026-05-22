import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveStorageUrl, resolveStorageUrls } from "../../storage/resolveStorageUrl";

const createMockSupabase = (
  signedUrl: string | null = "https://example.com/signed",
  error: unknown = null,
) => {
  const createSignedUrl = vi.fn(async () => ({
    data: { signedUrl },
    error,
  }));
  return {
    storage: {
      from: vi.fn(() => ({ createSignedUrl })),
    },
    _createSignedUrl: createSignedUrl,
  };
};

describe("resolveStorageUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for null path", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrl(supabase, null);
    expect(result).toBeNull();
  });

  it("returns null for undefined path", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrl(supabase, undefined);
    expect(result).toBeNull();
  });

  it("returns null for empty string path", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrl(supabase, "");
    expect(result).toBeNull();
  });

  it("returns original path when parseStoragePath and inferBucketFromPath both fail", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrl(supabase, "unknown/path/here.jpg");
    expect(result).toBe("unknown/path/here.jpg");
  });

  it("resolves standard bucket path via parseStoragePath (images)", async () => {
    const supabase = createMockSupabase("https://signed.com/img");
    const result = await resolveStorageUrl(supabase, "images/avatar/profile.jpg");
    expect(result).toBe("https://signed.com/img");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("resolves standard bucket path via parseStoragePath (videos)", async () => {
    const supabase = createMockSupabase("https://signed.com/vid");
    const result = await resolveStorageUrl(supabase, "videos/challenge/clip.mp4");
    expect(result).toBe("https://signed.com/vid");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("resolves files-public via parseStoragePath", async () => {
    const supabase = createMockSupabase("https://signed.com/pub");
    const result = await resolveStorageUrl(supabase, "files-public/document.pdf");
    expect(result).toBe("https://signed.com/pub");
    expect(supabase.storage.from).toHaveBeenCalledWith("files-public");
  });

  it("infers bucket for avatar path", async () => {
    const supabase = createMockSupabase("https://signed.com/avatar");
    const result = await resolveStorageUrl(supabase, "avatar/user123.png");
    expect(result).toBe("https://signed.com/avatar");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers bucket for group path", async () => {
    const supabase = createMockSupabase("https://signed.com/group");
    const result = await resolveStorageUrl(supabase, "group/photo.jpg");
    expect(result).toBe("https://signed.com/group");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers bucket for trips path", async () => {
    const supabase = createMockSupabase("https://signed.com/trip");
    const result = await resolveStorageUrl(supabase, "trips/photo.jpg");
    expect(result).toBe("https://signed.com/trip");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers bucket for rewards path", async () => {
    const supabase = createMockSupabase("https://signed.com/reward");
    const result = await resolveStorageUrl(supabase, "rewards/badge.jpg");
    expect(result).toBe("https://signed.com/reward");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers bucket for activity path", async () => {
    const supabase = createMockSupabase("https://signed.com/activity");
    const result = await resolveStorageUrl(supabase, "activity/feed.jpg");
    expect(result).toBe("https://signed.com/activity");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers videos bucket for challenge with video extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-vid");
    const result = await resolveStorageUrl(supabase, "challenge/submission.mp4");
    expect(result).toBe("https://signed.com/challenge-vid");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge with non-video extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-img");
    const result = await resolveStorageUrl(supabase, "challenge/submission.jpg");
    expect(result).toBe("https://signed.com/challenge-img");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers images bucket for challenge with mov extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-mov");
    const result = await resolveStorageUrl(supabase, "challenge/submission.mov");
    expect(result).toBe("https://signed.com/challenge-mov");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge with m4v extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-m4v");
    const result = await resolveStorageUrl(supabase, "challenge/submission.m4v");
    expect(result).toBe("https://signed.com/challenge-m4v");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge with webm extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-webm");
    const result = await resolveStorageUrl(supabase, "challenge/submission.webm");
    expect(result).toBe("https://signed.com/challenge-webm");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge with avi extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-avi");
    const result = await resolveStorageUrl(supabase, "challenge/submission.avi");
    expect(result).toBe("https://signed.com/challenge-avi");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge with mkv extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-mkv");
    const result = await resolveStorageUrl(supabase, "challenge/submission.mkv");
    expect(result).toBe("https://signed.com/challenge-mkv");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("infers images bucket for challenge without extension", async () => {
    const supabase = createMockSupabase("https://signed.com/challenge-noext");
    const result = await resolveStorageUrl(supabase, "challenge/submission");
    expect(result).toBe("https://signed.com/challenge-noext");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("infers bucket for files-public via inferBucketFromPath (non-standard prefix)", async () => {
    const supabase = createMockSupabase("https://signed.com/public");
    const result = await resolveStorageUrl(supabase, "/files-public/document.pdf");
    expect(result).toBe("https://signed.com/public");
    expect(supabase.storage.from).toHaveBeenCalledWith("files-public");
  });

  it("returns null when supabase returns an error", async () => {
    const supabase = createMockSupabase(null, new Error("network error"));
    const result = await resolveStorageUrl(supabase, "images/photo.jpg");
    expect(result).toBeNull();
  });

  it("returns null when signedUrl is missing", async () => {
    const supabase = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn(async () => ({
            data: { signedUrl: null },
            error: null,
          })),
        })),
      },
    };
    const result = await resolveStorageUrl(supabase, "images/photo.jpg");
    expect(result).toBeNull();
  });

  it("returns null when data is null", async () => {
    const supabase = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn(async () => ({
            data: null,
            error: null,
          })),
        })),
      },
    };
    const result = await resolveStorageUrl(supabase, "images/photo.jpg");
    expect(result).toBeNull();
  });

  it("uses custom seconds parameter", async () => {
    const supabase = createMockSupabase("https://signed.com/custom");
    await resolveStorageUrl(supabase, "images/photo.jpg", 3600);
    expect(supabase._createSignedUrl).toHaveBeenCalledWith("photo.jpg", 3600);
  });

  it("uses default seconds when not provided", async () => {
    const supabase = createMockSupabase("https://signed.com/default");
    await resolveStorageUrl(supabase, "images/photo.jpg");
    expect(supabase._createSignedUrl).toHaveBeenCalledWith("photo.jpg", 86400);
  });

  it("handles path with leading slashes for inferBucketFromPath", async () => {
    const supabase = createMockSupabase("https://signed.com/avatar");
    const result = await resolveStorageUrl(supabase, "/avatar/user123.png");
    expect(result).toBe("https://signed.com/avatar");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("handles empty normalized path for inferBucketFromPath", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrl(supabase, "/");
    expect(result).toBe("/");
  });
});

describe("resolveStorageUrls", () => {
  it("resolves images for multiple items", async () => {
    const supabase = createMockSupabase("https://signed.com/img");
    const items = [
      { id: "1", image: "images/a.jpg" },
      { id: "2", image: "images/b.jpg" },
      { id: "3", image: null },
    ];
    const result = await resolveStorageUrls(supabase, items);
    expect(result).toEqual([
      { id: "1", image: "https://signed.com/img" },
      { id: "2", image: "https://signed.com/img" },
      { id: "3", image: null },
    ]);
  });

  it("returns empty array for empty input", async () => {
    const supabase = createMockSupabase();
    const result = await resolveStorageUrls(supabase, []);
    expect(result).toEqual([]);
  });

  it("passes custom seconds to each resolveStorageUrl call", async () => {
    const supabase = createMockSupabase("https://signed.com/img");
    const items = [{ id: "1", image: "images/a.jpg" }];
    await resolveStorageUrls(supabase, items, 7200);
    expect(supabase._createSignedUrl).toHaveBeenCalledWith("a.jpg", 7200);
  });
});
