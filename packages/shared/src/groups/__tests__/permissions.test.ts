import { describe, expect, it } from "vitest";
import {
  canDeleteGroupAsOrganizer,
  canRemoveUserFromGroup,
  canUpdateGroup,
  canViewJoinRequests,
  isUserInGroup,
} from "../permissions";

describe("groups/permissions", () => {
  describe("canUpdateGroup", () => {
    it("allows admin to update group and change organizer", () => {
      const result = canUpdateGroup("ADMIN", false, true);
      expect(result).toEqual({ error: null });
    });

    it("allows organizer to update group without changing organizer", () => {
      const result = canUpdateGroup("USER", true, false);
      expect(result).toEqual({ error: null });
    });

    it("forbids non-admin and non-organizer to update group", () => {
      const result = canUpdateGroup("USER", false, false);
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Only group organizer or admin can update this group",
      });
    });

    it("forbids organizer from changing organizer", () => {
      const result = canUpdateGroup("USER", true, true);
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Only admin can change group organizer",
      });
    });
  });

  describe("canRemoveUserFromGroup", () => {
    it("allows admin to remove a regular user", () => {
      const result = canRemoveUserFromGroup("ADMIN", false, "user1", "org123");
      expect(result).toEqual({ error: null });
    });

    it("allows admin to remove the organizer", () => {
      const result = canRemoveUserFromGroup("ADMIN", false, "org123", "org123");
      expect(result).toEqual({ error: null });
    });

    it("allows organizer to remove a regular user", () => {
      const result = canRemoveUserFromGroup("USER", true, "user1", "org123");
      expect(result).toEqual({ error: null });
    });

    it("forbids organizer from removing themselves (organizer)", () => {
      const result = canRemoveUserFromGroup("USER", true, "org123", "org123");
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Group leader cannot be removed by organizer",
      });
    });

    it("forbids regular users from removing anyone", () => {
      const result = canRemoveUserFromGroup("USER", false, "user1", "org123");
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Only group organizer or admin can remove members",
      });
    });
  });

  describe("canDeleteGroupAsOrganizer", () => {
    it("allows organizer to delete group", () => {
      const result = canDeleteGroupAsOrganizer("org123", "org123");
      expect(result).toEqual({ error: null });
    });

    it("forbids non-organizer from deleting group", () => {
      const result = canDeleteGroupAsOrganizer("org123", "user1");
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Only group organizer can delete this group",
      });
    });
  });

  describe("canViewJoinRequests", () => {
    it("allows organizer to view join requests", () => {
      const result = canViewJoinRequests("org123", "org123");
      expect(result).toEqual({ error: null });
    });

    it("forbids non-organizer from viewing join requests", () => {
      const result = canViewJoinRequests("org123", "user1");
      expect(result).toEqual({
        error: "FORBIDDEN",
        message: "Only group organizer can view join requests",
      });
    });
  });

  describe("isUserInGroup", () => {
    it("returns true if user is in participants list", () => {
      const participants = [{ userId: "u1" }, { userId: "u2" }];
      expect(isUserInGroup("u1", participants)).toBe(true);
    });

    it("returns false if user is not in participants list", () => {
      const participants = [{ userId: "u1" }, { userId: "u2" }];
      expect(isUserInGroup("u3", participants)).toBe(false);
    });

    it("returns false if participants list is empty", () => {
      expect(isUserInGroup("u1", [])).toBe(false);
    });
  });
});
