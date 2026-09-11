import { IMAGE_TRANSFORMS } from "@mirai-app/common/storage";
import { describe, expect, it, vi } from "vitest";
import { resolveChallengeImages } from "../challenge/utils";
import { resolveGroupImage } from "../group/utils";
import { resolveRewardImageData } from "../reward/utils";

const spySupabase = () => {
  const createSignedUrl = vi.fn(async () => ({
    data: { signedUrl: "https://example.com/small.webp" },
    error: null,
  }));
  return { supabase: { storage: { from: () => ({ createSignedUrl }) } }, createSignedUrl };
};

describe("server-side image presets", () => {
  it("signs group images at thumbnail size", async () => {
    const { supabase, createSignedUrl } = spySupabase();

    await resolveGroupImage(supabase, "group/team.jpg");

    expect(createSignedUrl).toHaveBeenCalledWith("group/team.jpg", expect.any(Number), {
      transform: IMAGE_TRANSFORMS.thumbnail,
    });
  });

  it("signs reward images at thumbnail size", async () => {
    const { supabase, createSignedUrl } = spySupabase();

    await resolveRewardImageData(supabase, "rewards/mug.jpg");

    expect(createSignedUrl).toHaveBeenCalledWith("rewards/mug.jpg", expect.any(Number), {
      transform: IMAGE_TRANSFORMS.thumbnail,
    });
  });

  it("signs challenge images at feed-card size", async () => {
    const { supabase, createSignedUrl } = spySupabase();

    await resolveChallengeImages(supabase, [{ image: "challenge/task.jpg" }]);

    expect(createSignedUrl).toHaveBeenCalledWith("challenge/task.jpg", expect.any(Number), {
      transform: IMAGE_TRANSFORMS.feedCard,
    });
  });
});
