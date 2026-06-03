import { beforeEach, describe, expect, it } from "@jest/globals";
import { mapOverlayStore } from "~/stores/map/mapOverlayStore";

describe("mapOverlayStore actions", () => {
  beforeEach(() => {
    const state = mapOverlayStore.getState();
    state.setUsers([]);
    state.setCurrentUserId(undefined);
    state.backToList();
    state.collapseList();
    state.setShowManageModal(false);
    state.deselectUser();
    state.setFocusedCoordinate(null);
    state.setSharingUserIds([]);
    state.setAllAvailableUsers(undefined);
    state.setSharingSettings(undefined);
    state.setIsRemovingUser(false);
    // Reset theme to dark (initial state) — toggle if currently light
    if (state.mapTheme !== "dark") {
      state.toggleTheme();
    }
  });

  describe("selectUser", () => {
    it("should hide users list, collapse list, set follow mode to user, and focus coordinate", () => {
      const user = { coordinate: [52.2297, 21.0122] as [number, number], id: "1", name: "Test" };
      mapOverlayStore.getState().selectUser(user as any);
      const state = mapOverlayStore.getState();
      expect(state.showUsersList).toBe(false);
      expect(state.isListExpanded).toBe(false);
      expect(state.followMode).toBe("user");
      expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
    });
  });

  describe("deselectUser", () => {
    it("should set followMode to null", () => {
      mapOverlayStore.getState().selectUser({ coordinate: [1, 2], id: "1", name: "Test" } as any);
      mapOverlayStore.getState().deselectUser();
      expect(mapOverlayStore.getState().followMode).toBeNull();
    });
  });

  describe("backToList", () => {
    it("should show users list and clear follow mode", () => {
      mapOverlayStore.getState().selectUser({ coordinate: [1, 2], id: "1", name: "Test" } as any);
      mapOverlayStore.getState().backToList();
      const state = mapOverlayStore.getState();
      expect(state.showUsersList).toBe(true);
      expect(state.followMode).toBeNull();
    });
  });

  describe("toggleListExpansion", () => {
    it("should toggle isListExpanded from false to true", () => {
      mapOverlayStore.getState().toggleListExpansion();
      expect(mapOverlayStore.getState().isListExpanded).toBe(true);
    });

    it("should toggle isListExpanded from true to false", () => {
      mapOverlayStore.getState().toggleListExpansion();
      mapOverlayStore.getState().toggleListExpansion();
      expect(mapOverlayStore.getState().isListExpanded).toBe(false);
    });
  });

  describe("collapseList", () => {
    it("should set isListExpanded to false", () => {
      mapOverlayStore.getState().toggleListExpansion();
      mapOverlayStore.getState().collapseList();
      expect(mapOverlayStore.getState().isListExpanded).toBe(false);
    });
  });

  describe("setShowManageModal", () => {
    it("should set showManageModal", () => {
      mapOverlayStore.getState().setShowManageModal(true);
      expect(mapOverlayStore.getState().showManageModal).toBe(true);
    });
  });

  describe("setFollowMode", () => {
    it("should set followMode", () => {
      mapOverlayStore.getState().setFollowMode("user");
      expect(mapOverlayStore.getState().followMode).toBe("user");
    });

    it("should set followMode to null", () => {
      mapOverlayStore.getState().setFollowMode("user");
      mapOverlayStore.getState().setFollowMode(null);
      expect(mapOverlayStore.getState().followMode).toBeNull();
    });
  });

  describe("setFocusedCoordinate", () => {
    it("should set focusedCoordinate", () => {
      mapOverlayStore.getState().setFocusedCoordinate([52.2297, 21.0122]);
      expect(mapOverlayStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
    });

    it("should set focusedCoordinate to null", () => {
      mapOverlayStore.getState().setFocusedCoordinate([52.2297, 21.0122]);
      mapOverlayStore.getState().setFocusedCoordinate(null);
      expect(mapOverlayStore.getState().focusedCoordinate).toBeNull();
    });
  });

  describe("toggleTheme", () => {
    it("should toggle from dark to light", () => {
      mapOverlayStore.getState().toggleTheme();
      expect(mapOverlayStore.getState().mapTheme).toBe("light");
    });

    it("should toggle from light to dark", () => {
      mapOverlayStore.getState().toggleTheme();
      mapOverlayStore.getState().toggleTheme();
      expect(mapOverlayStore.getState().mapTheme).toBe("dark");
    });
  });

  describe("recenter", () => {
    it("should set followMode to null and focusedCoordinate when valid", () => {
      mapOverlayStore.getState().selectUser({ coordinate: [1, 2], id: "1", name: "Test" } as any);
      mapOverlayStore.getState().recenter([52.2297, 21.0122]);
      const state = mapOverlayStore.getState();
      expect(state.followMode).toBeNull();
      expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
    });

    it("should not change state when coordinate is null", () => {
      const before = mapOverlayStore.getState();
      mapOverlayStore.getState().recenter(null);
      const after = mapOverlayStore.getState();
      expect(after.focusedCoordinate).toBe(before.focusedCoordinate);
    });

    it("should not change state when coordinate has invalid length", () => {
      const before = mapOverlayStore.getState();
      mapOverlayStore.getState().recenter([52.2297] as any);
      const after = mapOverlayStore.getState();
      expect(after.focusedCoordinate).toBe(before.focusedCoordinate);
    });
  });

  describe("handleMapUserPress", () => {
    it("should set followMode to user and focusedCoordinate", () => {
      const user = { coordinate: [52.2297, 21.0122] as [number, number], id: "1", name: "Test" };
      mapOverlayStore.getState().handleMapUserPress(user as any);
      const state = mapOverlayStore.getState();
      expect(state.followMode).toBe("user");
      expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
    });
  });

  describe("handleMapPress", () => {
    it("should collapse list when expanded", () => {
      mapOverlayStore.getState().toggleListExpansion();
      mapOverlayStore.getState().handleMapPress();
      expect(mapOverlayStore.getState().isListExpanded).toBe(false);
    });

    it("should not change state when list is not expanded", () => {
      mapOverlayStore.getState().collapseList();
      const before = mapOverlayStore.getState().isListExpanded;
      mapOverlayStore.getState().handleMapPress();
      expect(mapOverlayStore.getState().isListExpanded).toBe(before);
    });
  });

  describe("setUsers", () => {
    it("should set users", () => {
      const users = [{ id: "1", name: "Test" }] as any;
      mapOverlayStore.getState().setUsers(users);
      expect(mapOverlayStore.getState().users).toEqual(users);
    });
  });

  describe("setCurrentUserId", () => {
    it("should set currentUserId", () => {
      mapOverlayStore.getState().setCurrentUserId("user1");
      expect(mapOverlayStore.getState().currentUserId).toBe("user1");
    });

    it("should set currentUserId to undefined", () => {
      mapOverlayStore.getState().setCurrentUserId("user1");
      mapOverlayStore.getState().setCurrentUserId(undefined);
      expect(mapOverlayStore.getState().currentUserId).toBeUndefined();
    });
  });

  describe("setSharingUserIds", () => {
    it("should set sharingUserIds", () => {
      mapOverlayStore.getState().setSharingUserIds(["user1", "user2"]);
      expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user1", "user2"]);
    });
  });

  describe("setAllAvailableUsers", () => {
    it("should set allAvailableUsers", () => {
      const users = [{ id: "1", firstName: "John" }];
      mapOverlayStore.getState().setAllAvailableUsers(users);
      expect(mapOverlayStore.getState().allAvailableUsers).toEqual(users);
    });
  });

  describe("setSharingSettings", () => {
    it("should set sharingSettings", () => {
      const settings = { usersToShareWith: [{ id: "1" }] };
      mapOverlayStore.getState().setSharingSettings(settings);
      expect(mapOverlayStore.getState().sharingSettings).toEqual(settings);
    });

    it("should set sharingSettings to null", () => {
      mapOverlayStore.getState().setSharingSettings(null);
      expect(mapOverlayStore.getState().sharingSettings).toBeNull();
    });
  });

  describe("setIsRemovingUser", () => {
    it("should set isRemovingUser", () => {
      mapOverlayStore.getState().setIsRemovingUser(true);
      expect(mapOverlayStore.getState().isRemovingUser).toBe(true);
    });
  });

  describe("handleRemoveUser", () => {
    it("should remove user from sharingUserIds and sharingSettings", () => {
      mapOverlayStore.getState().setSharingUserIds(["user1", "user2"]);
      mapOverlayStore.getState().setSharingSettings({
        usersToShareWith: [
          { id: "user1", firstName: "John" },
          { id: "user2", firstName: "Jane" },
        ],
      });

      mapOverlayStore.getState().handleRemoveUser("user1");

      const state = mapOverlayStore.getState();
      expect(state.sharingUserIds).toEqual(["user2"]);
      expect(state.sharingSettings).toEqual({
        usersToShareWith: [{ id: "user2", firstName: "Jane" }],
      });
      expect(state.isRemovingUser).toBe(false);
    });

    it("should handle removing user with no sharingSettings", () => {
      mapOverlayStore.getState().setSharingUserIds(["user1", "user2"]);
      mapOverlayStore.getState().setSharingSettings(undefined);

      mapOverlayStore.getState().handleRemoveUser("user1");

      const state = mapOverlayStore.getState();
      expect(state.sharingUserIds).toEqual(["user2"]);
      expect(state.sharingSettings).toBeUndefined();
    });

    it("should handle removing user with null sharingSettings", () => {
      mapOverlayStore.getState().setSharingUserIds(["user1", "user2"]);
      mapOverlayStore.getState().setSharingSettings(null);

      mapOverlayStore.getState().handleRemoveUser("user1");

      const state = mapOverlayStore.getState();
      expect(state.sharingUserIds).toEqual(["user2"]);
      expect(state.sharingSettings).toBeNull();
    });
  });
});
