import { describe, it, expect } from "@jest/globals";
import { extractSafeRewards, getRewardImages } from "~/components/rewards/RewardsView";

describe("RewardsView pure functions", () => {
  it("extractSafeRewards should return array when input is array", () => {
    const rewards = [{ id: "1", name: "Reward 1" }];
    expect(extractSafeRewards(rewards)).toEqual(rewards);
  });

  it("getRewardImages should prefer signedImageUrls", () => {
    const reward = {
      signedImageUrls: ["url1"],
      images: ["img1"],
      signedImageUrl: "single1",
      image: "single2",
    };
    expect(getRewardImages(reward)).toEqual(["url1"]);
  });
});
