import { describe, expect, it } from "vitest";
import { emptyReactionSummary, toggleHeartSummary } from "../reactions";

describe("emptyReactionSummary", () => {
  it("returns zeroed summary", () => {
    const result = emptyReactionSummary();
    expect(result).toEqual({
      total: 0,
      counts: { heart: 0, fire: 0, clap: 0, star: 0 },
      myReactions: [],
    });
  });
});

describe("toggleHeartSummary", () => {
  it("adds heart when not present", () => {
    const before = emptyReactionSummary();
    const after = toggleHeartSummary(before);

    expect(after.total).toBe(1);
    expect(after.counts.heart).toBe(1);
    expect(after.myReactions).toContain("heart");
  });

  it("removes heart when present", () => {
    const before = {
      total: 3,
      counts: { heart: 2, fire: 1, clap: 0, star: 0 },
      myReactions: ["heart", "fire"],
    };
    const after = toggleHeartSummary(before);

    expect(after.total).toBe(2);
    expect(after.counts.heart).toBe(1);
    expect(after.myReactions).not.toContain("heart");
    expect(after.myReactions).toContain("fire");
  });

  it("handles undefined input", () => {
    const after = toggleHeartSummary(undefined);

    expect(after.total).toBe(1);
    expect(after.counts.heart).toBe(1);
    expect(after.myReactions).toEqual(["heart"]);
  });

  it("does not go below zero", () => {
    const before = {
      total: 1,
      counts: { heart: 1, fire: 0, clap: 0, star: 0 },
      myReactions: ["heart"],
    };
    const after = toggleHeartSummary(before);

    expect(after.total).toBe(0);
    expect(after.counts.heart).toBe(0);
    expect(after.myReactions).toEqual([]);
  });

  it("preserves non-heart reactions and counts", () => {
    const before = {
      total: 5,
      counts: { heart: 1, fire: 2, clap: 1, star: 1 },
      myReactions: ["fire"],
    };
    const after = toggleHeartSummary(before);

    expect(after.counts).toEqual({ heart: 2, fire: 2, clap: 1, star: 1 });
    expect(after.myReactions).toEqual(["fire", "heart"]);
  });
});
