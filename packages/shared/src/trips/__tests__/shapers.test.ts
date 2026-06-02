import { describe, it, expect } from "vitest";
import {
  shapeTripGroup,
  shapeTripParticipant,
  buildTripDetailResponse,
  buildTripListItem,
} from "../shapers";

describe("shapeTripGroup", () => {
  it("attaches participant count and resolved image", () => {
    const group = { id: "g1", image: "old.jpg" };
    const countMap = new Map([["g1", 5]]);
    const result = shapeTripGroup(group, countMap, "new.jpg");
    expect(result).toEqual({ id: "g1", image: "new.jpg", _count: { participants: 5 } });
  });

  it("falls back to zero when group id is not in count map", () => {
    const group = { id: "g1", image: "old.jpg" };
    const result = shapeTripGroup(group, new Map(), null);
    expect(result._count.participants).toBe(0);
    expect(result.image).toBeNull();
  });
});

describe("shapeTripParticipant", () => {
  it("shapes participant with user, group, and email lookup", () => {
    const participant = {
      user: { authUserId: "u1", name: "Alice" },
      group: { id: "g1", isDeleted: false, image: "group.jpg" },
    };
    const countMap = new Map([["g1", 3]]);
    const emailMap = new Map([["u1", "alice@example.com"]]);
    const result = shapeTripParticipant(participant, countMap, emailMap);
    expect(result.user).toEqual({ name: "Alice", email: "alice@example.com" });
    expect(result.group).toEqual({ id: "g1", isDeleted: false, image: "group.jpg", _count: { participants: 3 } });
  });

  it("returns null user when participant has no user", () => {
    const participant = { user: null, group: { id: "g1", isDeleted: false } };
    const result = shapeTripParticipant(participant, new Map(), new Map());
    expect(result.user).toBeNull();
  });

  it("returns null email when authUserId is missing", () => {
    const participant = { user: { name: "Bob" }, group: null };
    const result = shapeTripParticipant(participant, new Map(), new Map());
    expect(result.user).toEqual({ name: "Bob", email: null });
  });

  it("returns null email when authUserId is not in lookup map", () => {
    const participant = { user: { authUserId: "u2", name: "Charlie" }, group: null };
    const result = shapeTripParticipant(participant, new Map(), new Map());
    expect(result.user).toEqual({ name: "Charlie", email: null });
  });

  it("filters out deleted groups", () => {
    const participant = {
      user: { authUserId: "u1", name: "Alice" },
      group: { id: "g1", isDeleted: true, image: "group.jpg" },
    };
    const result = shapeTripParticipant(participant, new Map(), new Map());
    expect(result.group).toBeNull();
  });

  it("handles null group", () => {
    const participant = { user: { authUserId: "u1", name: "Alice" }, group: null };
    const result = shapeTripParticipant(participant, new Map(), new Map());
    expect(result.group).toBeNull();
  });
});

describe("buildTripDetailResponse", () => {
  it("builds full detail response with all relations", () => {
    const trip = {
      tripSponsors: [{ sponsor: { isActive: true } }, { sponsor: { isActive: false } }],
      groups: [{ id: "g1", image: "g1.jpg" }, { id: "g2", image: null }],
      participants: [
        { user: { authUserId: "u1", name: "Alice" }, group: { id: "g1", isDeleted: false } },
        { user: null, group: { id: "g2", isDeleted: false } },
      ],
    };
    const countMap = new Map([["g1", 2], ["g2", 4]]);
    const emailMap = new Map([["u1", "alice@example.com"]]);
    const resolvedImages = new Map([["g1", "resolved-g1.jpg"]]);

    const result = buildTripDetailResponse(trip, countMap, emailMap, resolvedImages);

    expect(result.tripSponsors).toEqual([{ sponsor: { isActive: true } }]);
    expect(result.groups).toEqual([
      { id: "g1", image: "resolved-g1.jpg", _count: { participants: 2 } },
      { id: "g2", image: null, _count: { participants: 4 } },
    ]);
    expect(result.participants).toHaveLength(2);
    expect(result.participants[0]!.user).toEqual({ name: "Alice", email: "alice@example.com" });
    expect(result.participants[0]!.group).toEqual({ id: "g1", isDeleted: false, image: undefined, _count: { participants: 2 } });
    expect(result.participants[1]!.user).toBeNull();
  });

  it("handles minimal trip with empty arrays", () => {
    const trip = { tripSponsors: [], groups: [], participants: [] };
    const result = buildTripDetailResponse(trip, new Map(), new Map(), new Map());
    expect(result.tripSponsors).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.participants).toEqual([]);
  });

  it("falls back to group image when resolved image is missing", () => {
    const trip = {
      tripSponsors: [],
      groups: [{ id: "g1", image: "fallback.jpg" }],
      participants: [],
    };
    const result = buildTripDetailResponse(trip, new Map(), new Map(), new Map());
    expect(result.groups[0]!.image).toBe("fallback.jpg");
  });
});

describe("buildTripListItem", () => {
  it("filters inactive sponsors for list view", () => {
    const trip = {
      tripSponsors: [{ sponsor: { isActive: true } }, { sponsor: { isActive: false } }],
    };
    const result = buildTripListItem(trip);
    expect(result.tripSponsors).toEqual([{ sponsor: { isActive: true } }]);
  });

  it("returns empty sponsors when none are active", () => {
    const trip = {
      tripSponsors: [{ sponsor: { isActive: false } }],
    };
    const result = buildTripListItem(trip);
    expect(result.tripSponsors).toEqual([]);
  });
});
