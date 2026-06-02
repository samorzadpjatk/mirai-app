import { describe, it, expect } from "vitest";
import { resolveAwardedPoints } from "../points";

const createMockChallenge = (overrides: Record<string, unknown> = {}) => ({
  basePoints: 10,
  firstPlacePoints: 50,
  secondPlacePoints: 30,
  thirdPlacePoints: 20,
  ...overrides,
});

describe("resolveAwardedPoints", () => {
  it("returns awardedPoints when provided", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { awardedPoints: 100 });
    expect(result).toBe(100);
  });

  it("returns awardedPoints of 0 when explicitly provided", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { awardedPoints: 0 });
    expect(result).toBe(0);
  });

  it("returns firstPlacePoints for ranking 1", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { ranking: 1 });
    expect(result).toBe(50);
  });

  it("falls back to basePoints for ranking 1 when firstPlacePoints is null", () => {
    const challenge = createMockChallenge({ firstPlacePoints: null });
    const result = resolveAwardedPoints(challenge, { ranking: 1 });
    expect(result).toBe(10);
  });

  it("returns secondPlacePoints for ranking 2", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { ranking: 2 });
    expect(result).toBe(30);
  });

  it("falls back to basePoints for ranking 2 when secondPlacePoints is null", () => {
    const challenge = createMockChallenge({ secondPlacePoints: null });
    const result = resolveAwardedPoints(challenge, { ranking: 2 });
    expect(result).toBe(10);
  });

  it("returns thirdPlacePoints for ranking 3", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { ranking: 3 });
    expect(result).toBe(20);
  });

  it("falls back to basePoints for ranking 3 when thirdPlacePoints is null", () => {
    const challenge = createMockChallenge({ thirdPlacePoints: null });
    const result = resolveAwardedPoints(challenge, { ranking: 3 });
    expect(result).toBe(10);
  });

  it("returns basePoints for ranking greater than 3", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { ranking: 5 });
    expect(result).toBe(10);
  });

  it("returns basePoints when no awardedPoints and no ranking", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, {});
    expect(result).toBe(10);
  });

  it("prefers awardedPoints over ranking", () => {
    const challenge = createMockChallenge();
    const result = resolveAwardedPoints(challenge, { awardedPoints: 77, ranking: 1 });
    expect(result).toBe(77);
  });
});
