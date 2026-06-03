import { describe, expect, it } from "vitest";
import { filterActivities } from "../filters";

interface TestActivity {
  id: string;
  activityType: string;
  title: string;
}

const activities: TestActivity[] = [
  { id: "1", activityType: "custom", title: "First" },
  { id: "2", activityType: "submission", title: "Second" },
  { id: "3", activityType: "custom", title: "Third" },
  { id: "4", activityType: "challenge_event", title: "Fourth" },
];

describe("filterActivities", () => {
  it("returns all activities when filter is 'all'", () => {
    expect(filterActivities(activities, "all")).toEqual(activities);
  });

  it("filters by activity type", () => {
    const result = filterActivities(activities, "custom");
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when no matches", () => {
    const result = filterActivities(activities, "nonexistent");
    expect(result).toEqual([]);
  });

  it("moves focused activity to front", () => {
    const result = filterActivities(activities, "all", "3");
    expect(result[0]?.id).toBe("3");
    expect(result).toHaveLength(4);
  });

  it("ignores focusId when not found", () => {
    const result = filterActivities(activities, "all", "999");
    expect(result).toEqual(activities);
  });

  it("combines filter and focus", () => {
    const result = filterActivities(activities, "custom", "3");
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("3");
    expect(result[1]?.id).toBe("1");
  });

  it("ignores focusId when filtered list excludes it", () => {
    const result = filterActivities(activities, "submission", "1");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });
});
