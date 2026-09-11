import { describe, expect, it, vi } from "vitest";
import { IMAGE_TRANSFORMS } from "../../storage/imageTransform";
import { resolveStorageUrl, resolveStorageUrls } from "../../storage/resolveStorageUrl";

const createMockSupabase = (
  responses: { signedUrl: string | null; error: unknown }[] = [
    { signedUrl: "https://example.com/signed", error: null },
  ],
) => {
  let call = 0;
  const createSignedUrl = vi.fn(async () => {
    const response =
      responses[Math.min(call, responses.length - 1)] ??
      ({ signedUrl: null, error: null } as const);
    call += 1;
    return { data: { signedUrl: response.signedUrl }, error: response.error };
  });
  return {
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
    _createSignedUrl: createSignedUrl,
  };
};

describe("resolveStorageUrl with transform", () => {
  it("asks Storage for a resized variant when a transform is given", async () => {
    const supabase = createMockSupabase();

    await resolveStorageUrl(supabase, "avatar/user.jpg", 3600, IMAGE_TRANSFORMS.avatar);

    expect(supabase._createSignedUrl).toHaveBeenCalledWith("avatar/user.jpg", 3600, {
      transform: { width: 120, height: 120, resize: "cover", quality: 70 },
    });
  });

  it("never transforms an object in the videos bucket", async () => {
    const supabase = createMockSupabase();

    await resolveStorageUrl(supabase, "challenge/clip.mp4", 3600, IMAGE_TRANSFORMS.feedCard);

    expect(supabase._createSignedUrl).toHaveBeenCalledWith("challenge/clip.mp4", 3600);
  });

  it("falls back to the original when the source image cannot be transformed", async () => {
    // imgproxy rejects some large iPhone photos with 422 "Invalid source image".
    const supabase = createMockSupabase([
      { signedUrl: null, error: { message: "Invalid source image" } },
      { signedUrl: "https://example.com/original", error: null },
    ]);

    const result = await resolveStorageUrl(
      supabase,
      "challenge/huge.jpg",
      3600,
      IMAGE_TRANSFORMS.feedCard,
    );

    expect(result).toBe("https://example.com/original");
    expect(supabase._createSignedUrl).toHaveBeenNthCalledWith(2, "challenge/huge.jpg", 3600);
  });

  it("returns null when even the untransformed signing fails", async () => {
    const supabase = createMockSupabase([{ signedUrl: null, error: { message: "boom" } }]);

    const result = await resolveStorageUrl(
      supabase,
      "challenge/huge.jpg",
      3600,
      IMAGE_TRANSFORMS.feedCard,
    );

    expect(result).toBeNull();
  });

  it("does not retry when no transform was requested", async () => {
    const supabase = createMockSupabase([{ signedUrl: null, error: { message: "boom" } }]);

    await resolveStorageUrl(supabase, "avatar/user.jpg", 3600);

    expect(supabase._createSignedUrl).toHaveBeenCalledTimes(1);
  });
});

describe("IMAGE_TRANSFORMS presets", () => {
  it("covers every surface that renders a storage image", () => {
    expect(Object.keys(IMAGE_TRANSFORMS).sort()).toEqual([
      "avatar",
      "feedCard",
      "hero",
      "profileAvatar",
      "thumbnail",
      "tripTile",
    ]);
  });

  it("keeps every preset small enough to beat the original download", () => {
    for (const [name, transform] of Object.entries(IMAGE_TRANSFORMS)) {
      expect(transform.width, name).toBeGreaterThan(0);
      expect(transform.height, name).toBeGreaterThan(0);
      expect(transform.width, name).toBeLessThanOrEqual(1080);
      expect(transform.quality, name).toBeLessThanOrEqual(80);
    }
  });
});

describe("resolveStorageUrls with transform", () => {
  it("applies the transform to every item in the batch", async () => {
    const supabase = createMockSupabase();
    const items = [{ image: "group/a.jpg" }, { image: "group/b.jpg" }];

    await resolveStorageUrls(supabase, items, 3600, IMAGE_TRANSFORMS.thumbnail);

    expect(supabase._createSignedUrl).toHaveBeenNthCalledWith(1, "group/a.jpg", 3600, {
      transform: IMAGE_TRANSFORMS.thumbnail,
    });
    expect(supabase._createSignedUrl).toHaveBeenNthCalledWith(2, "group/b.jpg", 3600, {
      transform: IMAGE_TRANSFORMS.thumbnail,
    });
  });
});
