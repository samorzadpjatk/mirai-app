import { describe, it, expect } from "vitest";
import { parseRewardImages, serializeRewardImages } from "../images";

describe("parseRewardImages", () => {
  it("returns empty array for null", () => {
    expect(parseRewardImages(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(parseRewardImages(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseRewardImages("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(parseRewardImages("   ")).toEqual([]);
  });

  it("parses JSON array of strings", () => {
    expect(parseRewardImages('["img1.jpg", "img2.jpg"]')).toEqual(["img1.jpg", "img2.jpg"]);
  });

  it("filters non-string values from JSON array", () => {
    expect(parseRewardImages('["img1.jpg", 123, null, "img2.jpg"]')).toEqual(["img1.jpg", "img2.jpg"]);
  });

  it("trims and filters empty strings from JSON array", () => {
    expect(parseRewardImages('["img1.jpg", "  ", "", "img2.jpg"]')).toEqual(["img1.jpg", "img2.jpg"]);
  });

  it("returns single-item array for legacy string format", () => {
    expect(parseRewardImages("img1.jpg")).toEqual(["img1.jpg"]);
  });

  it("trims legacy string format", () => {
    expect(parseRewardImages("  img1.jpg  ")).toEqual(["img1.jpg"]);
  });

  it("returns empty array for invalid JSON that is whitespace", () => {
    expect(parseRewardImages("  ")).toEqual([]);
  });

  it("returns single-item array for invalid JSON that is non-whitespace", () => {
    expect(parseRewardImages("not-json")).toEqual(["not-json"]);
  });
});

describe("serializeRewardImages", () => {
  it("returns null for empty array", () => {
    expect(serializeRewardImages([])).toBeNull();
  });

  it("returns single string for one image", () => {
    expect(serializeRewardImages(["img1.jpg"])).toBe("img1.jpg");
  });

  it("returns JSON array for multiple images", () => {
    expect(serializeRewardImages(["img1.jpg", "img2.jpg"])).toBe('["img1.jpg","img2.jpg"]');
  });

  it("returns empty string for array with single empty string", () => {
    expect(serializeRewardImages([""])).toBe("");
  });
});
