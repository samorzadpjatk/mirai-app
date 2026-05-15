import { describe, it, expect, beforeEach } from "vitest";
import { mapStore, type MapUserLocation, type MapTheme } from "../mapStore";

describe("Map Store", () => {
  beforeEach(() => {
    // Reset store state before each test
    mapStore.setState({
      selectedUserId: null,
      showUsersList: true,
      isListExpanded: false,
      showManageModal: false,
      followMode: null,
      focusedCoordinate: null,
      mapTheme: "dark",
    });
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = mapStore.getState();
      expect(state.selectedUserId).toBeNull();
      expect(state.showUsersList).toBe(true);
      expect(state.isListExpanded).toBe(false);
      expect(state.showManageModal).toBe(false);
      expect(state.followMode).toBeNull();
      expect(state.focusedCoordinate).toBeNull();
      expect(state.mapTheme).toBe("dark");
    });
  });

  describe("selectUser", () => {
    it("should select user and update related state", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().selectUser("user-1", coordinate);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBe("user-1");
      expect(state.showUsersList).toBe(false);
      expect(state.isListExpanded).toBe(false);
      expect(state.followMode).toBe("user");
      expect(state.focusedCoordinate).toEqual(coordinate);
    });

    it("should update coordinate when selecting different user", () => {
      const coordinate1: [number, number] = [52.2297, 21.0122];
      const coordinate2: [number, number] = [50.0647, 19.945];

      mapStore.getState().selectUser("user-1", coordinate1);
      mapStore.getState().selectUser("user-2", coordinate2);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBe("user-2");
      expect(state.focusedCoordinate).toEqual(coordinate2);
    });

    it("should create a copy of the coordinate array", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().selectUser("user-1", coordinate);

      // Modify original coordinate
      coordinate[0] = 0;

      // Store should have the original values
      expect(mapStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
    });
  });

  describe("deselectUser", () => {
    it("should clear selectedUserId", () => {
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);
      expect(mapStore.getState().selectedUserId).toBe("user-1");

      mapStore.getState().deselectUser();
      expect(mapStore.getState().selectedUserId).toBeNull();
    });

    it("should not affect other state", () => {
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);
      mapStore.getState().deselectUser();

      const state = mapStore.getState();
      expect(state.showUsersList).toBe(false);
      expect(state.followMode).toBe("user");
      expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
    });
  });

  describe("backToList", () => {
    it("should clear selected user and show users list", () => {
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);
      mapStore.getState().backToList();

      const state = mapStore.getState();
      expect(state.selectedUserId).toBeNull();
      expect(state.showUsersList).toBe(true);
    });

    it("should work when no user is selected", () => {
      mapStore.getState().backToList();

      const state = mapStore.getState();
      expect(state.selectedUserId).toBeNull();
      expect(state.showUsersList).toBe(true);
    });
  });

  describe("toggleListExpansion", () => {
    it("should toggle isListExpanded from false to true", () => {
      expect(mapStore.getState().isListExpanded).toBe(false);
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);
    });

    it("should toggle isListExpanded from true to false", () => {
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(false);
    });

    it("should toggle multiple times correctly", () => {
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(false);
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);
    });
  });

  describe("collapseList", () => {
    it("should set isListExpanded to false", () => {
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);

      mapStore.getState().collapseList();
      expect(mapStore.getState().isListExpanded).toBe(false);
    });

    it("should remain false when already collapsed", () => {
      mapStore.getState().collapseList();
      expect(mapStore.getState().isListExpanded).toBe(false);
    });
  });

  describe("setShowManageModal", () => {
    it("should set showManageModal to true", () => {
      mapStore.getState().setShowManageModal(true);
      expect(mapStore.getState().showManageModal).toBe(true);
    });

    it("should set showManageModal to false", () => {
      mapStore.getState().setShowManageModal(true);
      mapStore.getState().setShowManageModal(false);
      expect(mapStore.getState().showManageModal).toBe(false);
    });
  });

  describe("setFollowMode", () => {
    it("should set followMode to user", () => {
      mapStore.getState().setFollowMode("user");
      expect(mapStore.getState().followMode).toBe("user");
    });

    it("should set followMode to null", () => {
      mapStore.getState().setFollowMode("user");
      mapStore.getState().setFollowMode(null);
      expect(mapStore.getState().followMode).toBeNull();
    });
  });

  describe("setFocusedCoordinate", () => {
    it("should set focused coordinate", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().setFocusedCoordinate(coordinate);
      expect(mapStore.getState().focusedCoordinate).toEqual(coordinate);
    });

    it("should set focused coordinate to null", () => {
      mapStore.getState().setFocusedCoordinate([52.2297, 21.0122]);
      mapStore.getState().setFocusedCoordinate(null);
      expect(mapStore.getState().focusedCoordinate).toBeNull();
    });

    it("should update coordinate", () => {
      mapStore.getState().setFocusedCoordinate([52.2297, 21.0122]);
      mapStore.getState().setFocusedCoordinate([50.0647, 19.945]);
      expect(mapStore.getState().focusedCoordinate).toEqual([50.0647, 19.945]);
    });
  });

  describe("toggleTheme", () => {
    it("should toggle from dark to light", () => {
      expect(mapStore.getState().mapTheme).toBe("dark");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
    });

    it("should toggle from light to dark", () => {
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("dark");
    });

    it("should toggle multiple times correctly", () => {
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("dark");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
    });
  });

  describe("recenter", () => {
    it("should deselect user and set focused coordinate", () => {
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);
      const newCoordinate: [number, number] = [50.0647, 19.945];

      mapStore.getState().recenter(newCoordinate);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBeNull();
      expect(state.focusedCoordinate).toEqual(newCoordinate);
    });

    it("should not change state when coordinate is null", () => {
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);

      mapStore.getState().recenter(null);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBe("user-1");
      expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
    });

    it("should work when no user is selected", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().recenter(coordinate);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBeNull();
      expect(state.focusedCoordinate).toEqual(coordinate);
    });
  });

  describe("handleMapUserPress", () => {
    it("should select user and set follow mode", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().handleMapUserPress("user-1", coordinate);

      const state = mapStore.getState();
      expect(state.selectedUserId).toBe("user-1");
      expect(state.followMode).toBe("user");
      expect(state.focusedCoordinate).toEqual(coordinate);
    });

    it("should not affect showUsersList", () => {
      mapStore.getState().handleMapUserPress("user-1", [52.2297, 21.0122]);
      expect(mapStore.getState().showUsersList).toBe(true);
    });

    it("should create a copy of the coordinate array", () => {
      const coordinate: [number, number] = [52.2297, 21.0122];
      mapStore.getState().handleMapUserPress("user-1", coordinate);

      // Modify original
      coordinate[0] = 0;

      // Store should have original values
      expect(mapStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
    });
  });

  describe("handleMapPress", () => {
    it("should collapse list when expanded", () => {
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);

      mapStore.getState().handleMapPress();
      expect(mapStore.getState().isListExpanded).toBe(false);
    });

    it("should not change state when list is not expanded", () => {
      const initialState = { ...mapStore.getState() };
      mapStore.getState().handleMapPress();

      const state = mapStore.getState();
      expect(state.isListExpanded).toBe(false);
      expect(state.selectedUserId).toBe(initialState.selectedUserId);
      expect(state.showUsersList).toBe(initialState.showUsersList);
    });
  });

  describe("Type Exports", () => {
    it("MapTheme should accept dark", () => {
      const theme: MapTheme = "dark";
      expect(theme).toBe("dark");
    });

    it("MapTheme should accept light", () => {
      const theme: MapTheme = "light";
      expect(theme).toBe("light");
    });

    it("MapUserLocation should have all required fields", () => {
      const location: MapUserLocation = {
        id: "user-1",
        coordinate: [52.2297, 21.0122],
        firstName: "John",
        lastName: "Doe",
        image: "avatar.jpg",
      };

      expect(location.id).toBe("user-1");
      expect(location.coordinate).toEqual([52.2297, 21.0122]);
      expect(location.firstName).toBe("John");
      expect(location.lastName).toBe("Doe");
      expect(location.image).toBe("avatar.jpg");
    });

    it("MapUserLocation should handle optional fields as null", () => {
      const location: MapUserLocation = {
        id: "user-1",
        coordinate: [52.2297, 21.0122],
        firstName: null,
        lastName: null,
        image: null,
      };

      expect(location.firstName).toBeNull();
      expect(location.lastName).toBeNull();
      expect(location.image).toBeNull();
    });

    it("MapUserLocation should handle optional fields as undefined", () => {
      const location: MapUserLocation = {
        id: "user-1",
        coordinate: [52.2297, 21.0122],
      };

      expect(location.firstName).toBeUndefined();
      expect(location.lastName).toBeUndefined();
      expect(location.image).toBeUndefined();
    });
  });

  describe("Complex Workflows", () => {
    it("should handle complete user selection workflow", () => {
      // Initial state
      expect(mapStore.getState().showUsersList).toBe(true);
      expect(mapStore.getState().selectedUserId).toBeNull();

      // Select user
      mapStore.getState().selectUser("user-1", [52.2297, 21.0122]);
      expect(mapStore.getState().selectedUserId).toBe("user-1");
      expect(mapStore.getState().showUsersList).toBe(false);
      expect(mapStore.getState().followMode).toBe("user");

      // Go back to list
      mapStore.getState().backToList();
      expect(mapStore.getState().selectedUserId).toBeNull();
      expect(mapStore.getState().showUsersList).toBe(true);
      expect(mapStore.getState().followMode).toBe("user"); // Follow mode persists
    });

    it("should handle map interaction workflow", () => {
      // Expand list
      mapStore.getState().toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);

      // Press on map collapses list
      mapStore.getState().handleMapPress();
      expect(mapStore.getState().isListExpanded).toBe(false);

      // Press on user marker
      mapStore.getState().handleMapUserPress("user-2", [50.0647, 19.945]);
      expect(mapStore.getState().selectedUserId).toBe("user-2");
      expect(mapStore.getState().followMode).toBe("user");

      // Recenter
      mapStore.getState().recenter([51.1079, 17.0385]);
      expect(mapStore.getState().selectedUserId).toBeNull();
      expect(mapStore.getState().focusedCoordinate).toEqual([51.1079, 17.0385]);
    });

    it("should handle theme switching", () => {
      expect(mapStore.getState().mapTheme).toBe("dark");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
      mapStore.getState().toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("dark");
    });

    it("should handle modal workflow", () => {
      mapStore.getState().setShowManageModal(true);
      expect(mapStore.getState().showManageModal).toBe(true);

      mapStore.getState().setShowManageModal(false);
      expect(mapStore.getState().showManageModal).toBe(false);
    });
  });

  describe("State Immutability", () => {
    it("should not mutate state directly", () => {
      const originalCoordinate: [number, number] = [52.2297, 21.0122];

      mapStore.getState().setFocusedCoordinate(originalCoordinate);
      const state1 = mapStore.getState().focusedCoordinate;

      mapStore.getState().setFocusedCoordinate([50.0647, 19.945]);
      const state2 = mapStore.getState().focusedCoordinate;

      // Original coordinate should be unchanged
      expect(originalCoordinate).toEqual([52.2297, 21.0122]);
      // State references should be different
      expect(state1).not.toBe(state2);
    });
  });
});
