import { describe, expect, it } from "@jest/globals";
import { shouldFetchNextPage } from "~/components/rewards/RewardsHistoryView";

describe("shouldFetchNextPage", () => {
  it("returns true when scrolled near bottom (default threshold)", () => {
    const contentOffsetY = 720;
    const layoutMeasurementHeight = 600;
    const contentSizeHeight = 1000;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      true,
    );
  });

  it("returns false when not near bottom", () => {
    const contentOffsetY = 100;
    const layoutMeasurementHeight = 600;
    const contentSizeHeight = 1000;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      false,
    );
  });

  it("returns true exactly at threshold boundary", () => {
    const contentOffsetY = 120;
    const layoutMeasurementHeight = 600;
    const contentSizeHeight = 1000;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      true,
    );
  });

  it("returns false just above threshold", () => {
    const contentOffsetY = 119;
    const layoutMeasurementHeight = 600;
    const contentSizeHeight = 1000;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      false,
    );
  });

  it("respects custom threshold", () => {
    const contentOffsetY = 400;
    const layoutMeasurementHeight = 600;
    const contentSizeHeight = 1000;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      true,
    );
    expect(
      shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight, 500),
    ).toBe(true);
  });

  it("returns true when content fits within viewport", () => {
    const contentOffsetY = 0;
    const layoutMeasurementHeight = 1000;
    const contentSizeHeight = 500;

    expect(shouldFetchNextPage(contentOffsetY, layoutMeasurementHeight, contentSizeHeight)).toBe(
      true,
    );
  });
});
