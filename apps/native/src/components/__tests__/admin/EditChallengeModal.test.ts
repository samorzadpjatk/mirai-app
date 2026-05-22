import { describe, it, expect } from "@jest/globals";
import { filterTripsByName } from "~/components/admin/challenges/EditChallengeModal";

describe("filterTripsByName", () => {
  it("should return matching trips limited to 6", () => {
    const trips = [
      { name: "Warsaw Trip" },
      { name: "Krakow Trip" },
      { name: "Warsaw Adventure" },
      { name: "Berlin Trip" },
      { name: "Paris Trip" },
      { name: "London Trip" },
      { name: "Rome Trip" },
      { name: "Madrid Trip" },
    ];

    const result = filterTripsByName(trips, "trip");
    expect(result).toHaveLength(6);
    expect(result.map((t) => t.name)).toEqual([
      "Warsaw Trip",
      "Krakow Trip",
      "Berlin Trip",
      "Paris Trip",
      "London Trip",
      "Rome Trip",
    ]);
  });

  it("should filter case-insensitively", () => {
    const trips = [{ name: "WARSAW" }, { name: "krakow" }];
    expect(filterTripsByName(trips, "war")).toEqual([{ name: "WARSAW" }]);
  });

  it("should return empty array for empty search", () => {
    expect(filterTripsByName([{ name: "Trip" }], "")).toEqual([]);
    expect(filterTripsByName([{ name: "Trip" }], "   ")).toEqual([]);
  });

  it("should return empty array when no matches", () => {
    expect(filterTripsByName([{ name: "Krakow" }], "Warsaw")).toEqual([]);
  });
});
