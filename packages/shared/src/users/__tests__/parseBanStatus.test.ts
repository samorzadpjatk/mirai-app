import { describe, it, expect } from "vitest";
import { parseBanStatus } from "../parseBanStatus";

describe("parseBanStatus", () => {
  it("returns not banned when bannedUntilRaw is null", () => {
    expect(parseBanStatus(null, "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("returns not banned when bannedUntilRaw is undefined", () => {
    expect(parseBanStatus(undefined, "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("returns not banned when bannedUntilRaw is an empty string", () => {
    expect(parseBanStatus("", "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("returns not banned when date is in the past", () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    expect(parseBanStatus(pastDate, "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("returns not banned when date is exactly now", () => {
    const now = new Date().toISOString();
    expect(parseBanStatus(now, "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("returns banned when date is in the future", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = parseBanStatus(futureDate, "Spam");
    expect(result.banned).toBe(true);
    expect(result.bannedUntil).toBe(futureDate);
    expect(result.reason).toBe("Spam");
  });

  it("returns not banned when date is invalid (NaN)", () => {
    expect(parseBanStatus("not-a-date", "Spam")).toEqual({
      banned: false,
      bannedUntil: null,
      reason: null,
    });
  });

  it("defaults reason to 'Temporary ban' when reasonRaw is null", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = parseBanStatus(futureDate, null);
    expect(result.banned).toBe(true);
    expect(result.reason).toBe("Temporary ban");
  });

  it("defaults reason to 'Temporary ban' when reasonRaw is undefined", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = parseBanStatus(futureDate, undefined);
    expect(result.banned).toBe(true);
    expect(result.reason).toBe("Temporary ban");
  });

  it("preserves provided reason when date is in the future", () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = parseBanStatus(futureDate, "Custom reason");
    expect(result.banned).toBe(true);
    expect(result.reason).toBe("Custom reason");
  });
});
