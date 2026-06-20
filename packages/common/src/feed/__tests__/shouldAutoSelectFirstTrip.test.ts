import { describe, expect, it } from "vitest";
import { shouldAutoSelectFirstTrip } from "../shouldAutoSelectFirstTrip";

const trips = [{ id: "trip-a" }, { id: "trip-b" }];

describe("shouldAutoSelectFirstTrip", () => {
  it("returns null when trips is empty", () => {
    const result = shouldAutoSelectFirstTrip({
      trips: [],
      selectedTripId: null,
      hasDismissedAutoPicker: false,
    });

    expect(result).toBeNull();
  });

  it("auto-selects first trip when no trip is selected", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: null,
      hasDismissedAutoPicker: false,
    });

    expect(result).toBe("trip-a");
  });

  it("does not auto-select when user dismissed the picker", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: null,
      hasDismissedAutoPicker: true,
    });

    expect(result).toBeNull();
  });

  it("returns null when selected trip is already the first trip", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: "trip-a",
      hasDismissedAutoPicker: false,
    });

    expect(result).toBeNull();
  });

  it("auto-selects first trip when selected id is stale", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: "stale-id",
      hasDismissedAutoPicker: false,
    });

    expect(result).toBe("trip-a");
  });

  it("does not recover stale selection when user dismissed the picker", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: "stale-id",
      hasDismissedAutoPicker: true,
    });

    expect(result).toBeNull();
  });

  it("returns null when a valid non-first trip is selected", () => {
    const result = shouldAutoSelectFirstTrip({
      trips,
      selectedTripId: "trip-b",
      hasDismissedAutoPicker: false,
    });

    expect(result).toBeNull();
  });
});
