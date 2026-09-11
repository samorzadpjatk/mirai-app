import { IMAGE_TRANSFORMS } from "@mirai-app/common/storage";
import { describe, expect, it, vi } from "vitest";
import { resolveAvatarUrls } from "../queries";

describe("resolveAvatarUrls", () => {
  it("signs a 120x120 avatar instead of the full-resolution upload", async () => {
    const createSignedUrl = vi.fn(async () => ({
      data: { signedUrl: "https://example.com/avatar.webp" },
      error: null,
    }));
    const supabase = { storage: { from: () => ({ createSignedUrl }) } };

    const result = await resolveAvatarUrls(
      { supabase } as unknown as Parameters<typeof resolveAvatarUrls>[0],
      new Set(["user-1"]),
    );

    expect(result).toEqual({ "user-1": "https://example.com/avatar.webp" });
    expect(createSignedUrl).toHaveBeenCalledWith("avatar/user-1.jpg", 3600, {
      transform: IMAGE_TRANSFORMS.avatar,
    });
  });

  it("returns an empty map without calling Storage when there are no authors", async () => {
    const createSignedUrl = vi.fn();
    const supabase = { storage: { from: () => ({ createSignedUrl }) } };

    const result = await resolveAvatarUrls(
      { supabase } as unknown as Parameters<typeof resolveAvatarUrls>[0],
      new Set(),
    );

    expect(result).toEqual({});
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});
