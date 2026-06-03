import { describe, expect, it } from "@jest/globals";
import {
  buildExpandButtonText,
  calculateHasMoreThanPreview,
  calculateVisibleMembers,
  formatMemberRole,
} from "../trips/groups/details/GroupMemberList";

describe("calculateHasMoreThanPreview", () => {
  it("should return true when more than 3 members", () => {
    const members = [
      { id: "1", name: "A", initials: "A", role: "member", isLeader: false },
      { id: "2", name: "B", initials: "B", role: "member", isLeader: false },
      { id: "3", name: "C", initials: "C", role: "member", isLeader: false },
      { id: "4", name: "D", initials: "D", role: "member", isLeader: false },
    ];
    expect(calculateHasMoreThanPreview(members)).toBe(true);
  });

  it("should return false when 3 or fewer members", () => {
    const members = [
      { id: "1", name: "A", initials: "A", role: "member", isLeader: false },
      { id: "2", name: "B", initials: "B", role: "member", isLeader: false },
    ];
    expect(calculateHasMoreThanPreview(members)).toBe(false);
  });
});

describe("calculateVisibleMembers", () => {
  it("should return all members when expanded", () => {
    const members = [
      { id: "1", name: "A", initials: "A", role: "member", isLeader: false },
      { id: "2", name: "B", initials: "B", role: "member", isLeader: false },
      { id: "3", name: "C", initials: "C", role: "member", isLeader: false },
      { id: "4", name: "D", initials: "D", role: "member", isLeader: false },
    ];
    expect(calculateVisibleMembers(members, true)).toEqual(members);
  });

  it("should return first 3 members when not expanded", () => {
    const members = [
      { id: "1", name: "A", initials: "A", role: "member", isLeader: false },
      { id: "2", name: "B", initials: "B", role: "member", isLeader: false },
      { id: "3", name: "C", initials: "C", role: "member", isLeader: false },
      { id: "4", name: "D", initials: "D", role: "member", isLeader: false },
    ];
    expect(calculateVisibleMembers(members, false)).toEqual(members.slice(0, 3));
  });
});

describe("buildExpandButtonText", () => {
  it("should return 'Show Less' when expanded", () => {
    expect(buildExpandButtonText(true)).toBe("Show Less");
  });

  it("should return 'View All' when not expanded", () => {
    expect(buildExpandButtonText(false)).toBe("View All");
  });
});

describe("formatMemberRole", () => {
  it("should uppercase role", () => {
    expect(formatMemberRole("member")).toBe("MEMBER");
    expect(formatMemberRole("leader")).toBe("LEADER");
  });

  it("should handle already uppercase", () => {
    expect(formatMemberRole("MEMBER")).toBe("MEMBER");
  });
});
