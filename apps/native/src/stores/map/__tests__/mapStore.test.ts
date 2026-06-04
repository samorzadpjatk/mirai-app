import { beforeEach, describe, expect, it } from "@jest/globals";
import { mapStore } from "../mapStore";

describe("mapStore", () => {
  beforeEach(() => {
    mapStore.setState({
      selectedUserId: "",
      showUsersList: true,
      isListExpanded: false,
      showManageModal: false,
      followMode: "none",
      focusedCoordinate: null,
      mapTheme: "dark",
    });
  });

  describe("initial state", () => {
    it("should have empty selectedUserId", () => {
      const state = mapStore.getState();
      expect(state.selectedUserId).toBe("");
    });

    it("should have showUsersList as true", () => {
      const state = mapStore.getState();
      expect(state.showUsersList).toBe(true);
    });

    it("should have isListExpanded as false", () => {
      const state = mapStore.getState();
      expect(state.isListExpanded).toBe(false);
    });

    it("should have showManageModal as false", () => {
      const state = mapStore.getState();
      expect(state.showManageModal).toBe(false);
    });

    it("should have followMode as none", () => {
      const state = mapStore.getState();
      expect(state.followMode).toBe("none");
    });

    it("should have focusedCoordinate as null", () => {
      const state = mapStore.getState();
      expect(state.focusedCoordinate).toBeNull();
    });

    it("should have mapTheme as dark", () => {
      const state = mapStore.getState();
      expect(state.mapTheme).toBe("dark");
    });
  });

  describe("actions", () => {
    describe("selectUser", () => {
      it("should select user and update related state", () => {
        const { selectUser } = mapStore.getState();
        selectUser("user-123", [52.2297, 21.0122]);

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("user-123");
        expect(state.showUsersList).toBe(false);
        expect(state.isListExpanded).toBe(false);
        expect(state.followMode).toBe("user");
        expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
      });

      it("should handle different coordinates", () => {
        const { selectUser } = mapStore.getState();
        selectUser("user-456", [40.7128, -74.006]);

        const state = mapStore.getState();
        expect(state.focusedCoordinate).toEqual([40.7128, -74.006]);
      });
    });

    describe("deselectUser", () => {
      it("should deselect user", () => {
        const { selectUser, deselectUser } = mapStore.getState();
        selectUser("user-123", [52.2297, 21.0122]);
        deselectUser();

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("");
      });

      it("should handle deselect when no user selected", () => {
        const { deselectUser } = mapStore.getState();
        deselectUser();

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("");
      });
    });

    describe("backToList", () => {
      it("should return to list view", () => {
        const { selectUser, backToList } = mapStore.getState();
        selectUser("user-123", [52.2297, 21.0122]);
        backToList();

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("");
        expect(state.showUsersList).toBe(true);
      });
    });

    describe("toggleListExpansion", () => {
      it("should toggle list expansion from false to true", () => {
        const { toggleListExpansion } = mapStore.getState();
        toggleListExpansion();

        const state = mapStore.getState();
        expect(state.isListExpanded).toBe(true);
      });

      it("should toggle list expansion from true to false", () => {
        const { toggleListExpansion } = mapStore.getState();
        toggleListExpansion();
        toggleListExpansion();

        const state = mapStore.getState();
        expect(state.isListExpanded).toBe(false);
      });
    });

    describe("collapseList", () => {
      it("should collapse expanded list", () => {
        const { toggleListExpansion, collapseList } = mapStore.getState();
        toggleListExpansion();
        expect(mapStore.getState().isListExpanded).toBe(true);

        collapseList();
        expect(mapStore.getState().isListExpanded).toBe(false);
      });

      it("should keep list collapsed if already collapsed", () => {
        const { collapseList } = mapStore.getState();
        collapseList();
        expect(mapStore.getState().isListExpanded).toBe(false);
      });
    });

    describe("setShowManageModal", () => {
      it("should open manage modal", () => {
        const { setShowManageModal } = mapStore.getState();
        setShowManageModal(true);

        expect(mapStore.getState().showManageModal).toBe(true);
      });

      it("should close manage modal", () => {
        const { setShowManageModal } = mapStore.getState();
        setShowManageModal(true);
        setShowManageModal(false);

        expect(mapStore.getState().showManageModal).toBe(false);
      });
    });

    describe("setFollowMode", () => {
      it("should set follow mode to user", () => {
        const { setFollowMode } = mapStore.getState();
        setFollowMode("user");

        expect(mapStore.getState().followMode).toBe("user");
      });

      it("should set follow mode to none", () => {
        const { setFollowMode } = mapStore.getState();
        setFollowMode("user");
        setFollowMode("none");

        expect(mapStore.getState().followMode).toBe("none");
      });
    });

    describe("setFocusedCoordinate", () => {
      it("should set focused coordinate", () => {
        const { setFocusedCoordinate } = mapStore.getState();
        setFocusedCoordinate([51.5074, -0.1278]);

        expect(mapStore.getState().focusedCoordinate).toEqual([51.5074, -0.1278]);
      });

      it("should clear focused coordinate", () => {
        const { setFocusedCoordinate } = mapStore.getState();
        setFocusedCoordinate([51.5074, -0.1278]);
        setFocusedCoordinate(null);

        expect(mapStore.getState().focusedCoordinate).toBeNull();
      });
    });

    describe("toggleTheme", () => {
      it("should toggle from dark to light", () => {
        const { toggleTheme } = mapStore.getState();
        expect(mapStore.getState().mapTheme).toBe("dark");

        toggleTheme();
        expect(mapStore.getState().mapTheme).toBe("light");
      });

      it("should toggle from light to dark", () => {
        const { toggleTheme } = mapStore.getState();
        toggleTheme();
        toggleTheme();

        expect(mapStore.getState().mapTheme).toBe("dark");
      });
    });

    describe("recenter", () => {
      it("should recenter map with current coordinate", () => {
        const { recenter } = mapStore.getState();
        recenter([52.2297, 21.0122]);

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("");
        expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
      });

      it("should not recenter if coordinate is null", () => {
        const { selectUser, recenter } = mapStore.getState();
        selectUser("user-123", [52.2297, 21.0122]);

        recenter(null);

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("user-123");
      });
    });

    describe("handleMapUserPress", () => {
      it("should handle map user press", () => {
        const { handleMapUserPress } = mapStore.getState();
        handleMapUserPress("user-789", [48.8566, 2.3522]);

        const state = mapStore.getState();
        expect(state.selectedUserId).toBe("user-789");
        expect(state.followMode).toBe("user");
        expect(state.focusedCoordinate).toEqual([48.8566, 2.3522]);
      });
    });

    describe("handleMapPress", () => {
      it("should collapse list when expanded", () => {
        const { toggleListExpansion, handleMapPress } = mapStore.getState();
        toggleListExpansion();
        expect(mapStore.getState().isListExpanded).toBe(true);

        handleMapPress();
        expect(mapStore.getState().isListExpanded).toBe(false);
      });

      it("should not change state when list is not expanded", () => {
        const { handleMapPress } = mapStore.getState();
        handleMapPress();

        expect(mapStore.getState().isListExpanded).toBe(false);
      });
    });
  });

  describe("complex interactions", () => {
    it("should handle complete user selection flow", () => {
      const state = mapStore.getState();

      expect(state.showUsersList).toBe(true);

      state.selectUser("user-1", [52.2297, 21.0122]);
      expect(mapStore.getState().showUsersList).toBe(false);
      expect(mapStore.getState().selectedUserId).toBe("user-1");

      state.backToList();
      expect(mapStore.getState().showUsersList).toBe(true);
      expect(mapStore.getState().selectedUserId).toBe("");

      state.toggleListExpansion();
      expect(mapStore.getState().isListExpanded).toBe(true);

      state.handleMapPress();
      expect(mapStore.getState().isListExpanded).toBe(false);
    });

    it("should handle theme switching multiple times", () => {
      const { toggleTheme } = mapStore.getState();

      toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");

      toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("dark");

      toggleTheme();
      expect(mapStore.getState().mapTheme).toBe("light");
    });
  });
});
