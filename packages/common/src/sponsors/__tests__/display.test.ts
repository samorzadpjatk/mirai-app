import { describe, expect, it } from "vitest";
import {
  DEFAULT_SPONSOR_DISPLAY,
  type SponsorDisplayRow,
  attachSponsorDisplay,
  buildSponsorDisplayMap,
} from "../display";

const displayRow = (overrides: Partial<SponsorDisplayRow> = {}): SponsorDisplayRow => ({
  sponsorId: "sponsor-1",
  height: 18,
  offsetX: 2,
  offsetY: -4,
  ...overrides,
});

describe("buildSponsorDisplayMap", () => {
  it("returns an empty map for no rows", () => {
    expect(buildSponsorDisplayMap([]).size).toBe(0);
  });

  it("indexes rows by sponsor id", () => {
    const map = buildSponsorDisplayMap([
      displayRow(),
      displayRow({ sponsorId: "sponsor-2", height: 30, offsetX: 0, offsetY: 0 }),
    ]);

    expect(map.get("sponsor-1")).toEqual({ height: 18, offsetX: 2, offsetY: -4 });
    expect(map.get("sponsor-2")).toEqual({ height: 30, offsetX: 0, offsetY: 0 });
  });

  it("normalises database nulls to the default layout", () => {
    const map = buildSponsorDisplayMap([
      { sponsorId: "sponsor-1", height: null, offsetX: null, offsetY: null },
    ]);

    expect(map.get("sponsor-1")).toEqual(DEFAULT_SPONSOR_DISPLAY);
  });
});

describe("attachSponsorDisplay", () => {
  it("attaches the matching display row to each trip sponsor", () => {
    const result = attachSponsorDisplay(
      [{ sponsorId: "sponsor-1", name: "Netcompany" }],
      [displayRow()],
    );

    expect(result).toEqual([
      {
        sponsorId: "sponsor-1",
        name: "Netcompany",
        display: { height: 18, offsetX: 2, offsetY: -4 },
      },
    ]);
  });

  it("falls back to the default layout when no display row exists", () => {
    const result = attachSponsorDisplay([{ sponsorId: "sponsor-1" }], []);

    expect(result[0]?.display).toEqual(DEFAULT_SPONSOR_DISPLAY);
  });

  it("does not share the default layout object between entries", () => {
    const result = attachSponsorDisplay([{ sponsorId: "a" }, { sponsorId: "b" }], []);

    expect(result[0]?.display).not.toBe(result[1]?.display);
    expect(result[0]?.display).not.toBe(DEFAULT_SPONSOR_DISPLAY);
  });

  it("ignores display rows for sponsors that are not in the list", () => {
    const result = attachSponsorDisplay(
      [{ sponsorId: "sponsor-1" }],
      [displayRow({ sponsorId: "sponsor-9", height: 99 })],
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.display).toEqual(DEFAULT_SPONSOR_DISPLAY);
  });

  it("returns an empty list when there are no trip sponsors", () => {
    expect(attachSponsorDisplay([], [displayRow()])).toEqual([]);
  });
});
