import { describe, expect, it } from "vitest";
import {
  type TripResourceFragment,
  buildTripResourceFragmentKey,
  mergeTripResourceFragments,
} from "../merge";

const fragment = (overrides: Partial<TripResourceFragment> = {}): TripResourceFragment => ({
  type: "interactive_map",
  label: "Mapa",
  sortOrder: 1,
  url: "",
  storagePath: "",
  fileName: "",
  publicUrl: "",
  iconName: "",
  value: "",
  description: "",
  ...overrides,
});

describe("mergeTripResourceFragments", () => {
  it("merges fragments that share type, label and sortOrder", () => {
    const merged = mergeTripResourceFragments([
      fragment({ url: "https://example.com/map", description: "Plan ośrodka" }),
      fragment({ iconName: "compass" }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      type: "interactive_map",
      label: "Mapa",
      sortOrder: 1,
      url: "https://example.com/map",
      description: "Plan ośrodka",
      iconName: "compass",
    });
  });

  it("recombines a file fragment with its icon fragment", () => {
    const merged = mergeTripResourceFragments([
      fragment({
        type: "infopack",
        label: "Przewodnik",
        sortOrder: 4,
        storagePath: "public/integral/guide.pdf",
        fileName: "guide",
        publicUrl: "https://cdn.example.com/guide.pdf",
      }),
      fragment({ type: "infopack", label: "Przewodnik", sortOrder: 4, iconName: "book" }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      storagePath: "public/integral/guide.pdf",
      fileName: "guide",
      publicUrl: "https://cdn.example.com/guide.pdf",
      iconName: "book",
    });
  });

  it("keeps resources of the same type apart when label or sortOrder differ", () => {
    const merged = mergeTripResourceFragments([
      fragment({ type: "link", label: "First", sortOrder: 1, url: "https://example.com/first" }),
      fragment({ type: "link", label: "Second", sortOrder: 2, url: "https://example.com/second" }),
      fragment({ type: "link", label: "Second", sortOrder: 3, url: "https://example.com/third" }),
    ]);

    expect(merged).toHaveLength(3);
    expect(merged.map((resource) => resource.url)).toEqual([
      "https://example.com/first",
      "https://example.com/second",
      "https://example.com/third",
    ]);
  });

  it("preserves the order of the first fragment of each group", () => {
    const merged = mergeTripResourceFragments([
      fragment({ type: "hero_image", label: "Hero", sortOrder: 0, storagePath: "images/hero.png" }),
      fragment({ type: "sos", label: "SOS", sortOrder: 3, description: "Dzwoń na 112." }),
      fragment({ type: "hero_image", label: "Hero", sortOrder: 0, iconName: "image" }),
      fragment({ type: "sos", label: "SOS", sortOrder: 3, value: "112" }),
    ]);

    expect(merged.map((resource) => resource.type)).toEqual(["hero_image", "sos"]);
  });

  it("lets the first non-empty value win and never overwrites a filled field", () => {
    const merged = mergeTripResourceFragments([
      fragment({ url: "https://example.com/first" }),
      fragment({ url: "https://example.com/second" }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.url).toBe("https://example.com/first");
  });

  it("treats null and undefined the same as an empty string", () => {
    const merged = mergeTripResourceFragments([
      { type: "sos", label: "SOS", sortOrder: 0, description: null, value: undefined },
      { type: "sos", label: "SOS", sortOrder: 0, description: "Dzwoń na 112.", value: "112" },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ description: "Dzwoń na 112.", value: "112" });
  });

  it("does not mutate the input fragments", () => {
    const first = fragment({ url: "https://example.com/map" });
    const second = fragment({ iconName: "compass" });

    mergeTripResourceFragments([first, second]);

    expect(first.iconName).toBe("");
    expect(second.url).toBe("");
  });

  it("returns an empty array for no fragments", () => {
    expect(mergeTripResourceFragments([])).toEqual([]);
  });
});

describe("buildTripResourceFragmentKey", () => {
  it("builds the same key for fragments of the same logical resource", () => {
    expect(buildTripResourceFragmentKey(fragment({ url: "https://example.com" }))).toBe(
      buildTripResourceFragmentKey(fragment({ iconName: "compass" })),
    );
  });

  it("builds different keys when the sortOrder differs", () => {
    expect(buildTripResourceFragmentKey(fragment({ sortOrder: 1 }))).not.toBe(
      buildTripResourceFragmentKey(fragment({ sortOrder: 2 })),
    );
  });
});
