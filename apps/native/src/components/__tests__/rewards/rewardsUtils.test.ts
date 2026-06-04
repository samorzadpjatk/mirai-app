import { describe, expect, it } from "@jest/globals";
import { extractSafeRewards, getRewardImages } from "../../rewards/RewardsView";

describe("extractSafeRewards", () => {
  it("should return array when input is array", () => {
    const rewards = [{ id: "1", name: "Reward 1" }];
    expect(extractSafeRewards(rewards)).toEqual(rewards);
  });

  it("should return empty array when input is undefined", () => {
    expect(extractSafeRewards(undefined)).toEqual([]);
  });

  it("should return empty array when input is not an array", () => {
    expect(extractSafeRewards({})).toEqual([]);
    expect(extractSafeRewards("string")).toEqual([]);
    expect(extractSafeRewards(null)).toEqual([]);
  });
});

describe("getRewardImages", () => {
  it("should prefer signedImageUrls over images", () => {
    const reward = {
      signedImageUrls: ["url1", "url2"],
      images: ["img1"],
      signedImageUrl: "single1",
      image: "single2",
    };
    expect(getRewardImages(reward)).toEqual(["url1", "url2"]);
  });

  it("should fallback to images when no signedImageUrls", () => {
    const reward = {
      images: ["img1", "img2"],
    };
    expect(getRewardImages(reward)).toEqual(["img1", "img2"]);
  });

  it("should fallback to signedImageUrl when no arrays", () => {
    const reward = {
      signedImageUrl: "single",
    };
    expect(getRewardImages(reward)).toEqual(["single"]);
  });

  it("should fallback to image when no other fields", () => {
    const reward = {
      image: "single",
    };
    expect(getRewardImages(reward)).toEqual(["single"]);
  });

  it("should return empty array when no images", () => {
    expect(getRewardImages({})).toEqual([]);
  });
});
