import { describe, it, expect } from "vitest";
import { extractActiveSponsors } from "../filters";
import type { Sponsor, TripSponsor } from "@mirai-app/db";

const createMockSponsor = (overrides: Partial<Sponsor> = {}): Sponsor => ({
  id: "sponsor-1",
  name: "Test Sponsor",
  description: "A test sponsor",
  logoPath: "/logo.png",
  height: null,
  offsetX: null,
  offsetY: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTripSponsor = (
  sponsor: Sponsor | null = null,
  overrides: Partial<TripSponsor> = {},
): TripSponsor & { sponsor: Sponsor | null } => ({
  id: "trip-sponsor-1",
  tripId: "trip-1",
  sponsorId: sponsor?.id ?? "sponsor-1",
  createdAt: new Date(),
  sponsor,
  ...overrides,
});

describe("extractActiveSponsors", () => {
  it("returns empty array for empty input", () => {
    const result = extractActiveSponsors([]);
    expect(result).toEqual([]);
  });

  it("returns active sponsors", () => {
    const activeSponsor = createMockSponsor({ id: "active-1", name: "Active Sponsor" });
    const tripSponsors = [
      createMockTripSponsor(activeSponsor),
    ];
    const result = extractActiveSponsors(tripSponsors);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("active-1");
  });

  it("filters out inactive sponsors", () => {
    const activeSponsor = createMockSponsor({ id: "active-1", isActive: true });
    const inactiveSponsor = createMockSponsor({ id: "inactive-1", isActive: false });
    const tripSponsors = [
      createMockTripSponsor(activeSponsor),
      createMockTripSponsor(inactiveSponsor),
    ];
    const result = extractActiveSponsors(tripSponsors);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("active-1");
  });

  it("filters out entries with null sponsor", () => {
    const activeSponsor = createMockSponsor({ id: "active-1" });
    const tripSponsors = [
      createMockTripSponsor(activeSponsor),
      createMockTripSponsor(null),
    ];
    const result = extractActiveSponsors(tripSponsors);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("active-1");
  });

  it("returns multiple active sponsors in order", () => {
    const sponsor1 = createMockSponsor({ id: "s1", name: "Sponsor 1" });
    const sponsor2 = createMockSponsor({ id: "s2", name: "Sponsor 2" });
    const sponsor3 = createMockSponsor({ id: "s3", name: "Sponsor 3", isActive: false });
    const tripSponsors = [
      createMockTripSponsor(sponsor1),
      createMockTripSponsor(sponsor2),
      createMockTripSponsor(sponsor3),
    ];
    const result = extractActiveSponsors(tripSponsors);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe("s1");
    expect(result[1]!.id).toBe("s2");
  });
});
