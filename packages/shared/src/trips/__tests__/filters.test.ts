import { describe, it, expect } from "vitest";
import { filterActiveSponsors } from "../filters";

describe("filterActiveSponsors", () => {
  it("returns all sponsors when every sponsor is active", () => {
    const sponsors = [{ sponsor: { isActive: true } }, { sponsor: { isActive: true } }];
    expect(filterActiveSponsors(sponsors)).toEqual(sponsors);
  });

  it("filters out inactive sponsors from a mixed list", () => {
    const sponsors = [
      { sponsor: { isActive: true } },
      { sponsor: { isActive: false } },
      { sponsor: { isActive: true } },
    ];
    expect(filterActiveSponsors(sponsors)).toEqual([
      { sponsor: { isActive: true } },
      { sponsor: { isActive: true } },
    ]);
  });

  it("returns empty array when all sponsors are inactive", () => {
    const sponsors = [{ sponsor: { isActive: false } }, { sponsor: { isActive: false } }];
    expect(filterActiveSponsors(sponsors)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(filterActiveSponsors([])).toEqual([]);
  });

  it("filters out entries with null sponsor", () => {
    const sponsors = [{ sponsor: { isActive: true } }, { sponsor: null }, { sponsor: { isActive: false } }];
    expect(filterActiveSponsors(sponsors)).toEqual([{ sponsor: { isActive: true } }]);
  });

  it("filters out entries with undefined sponsor", () => {
    const sponsors = [{ sponsor: { isActive: true } }, { sponsor: undefined }, { sponsor: { isActive: false } }];
    expect(filterActiveSponsors(sponsors)).toEqual([{ sponsor: { isActive: true } }]);
  });
});
