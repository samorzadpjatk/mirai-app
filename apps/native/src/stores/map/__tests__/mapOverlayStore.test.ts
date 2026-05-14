import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { mapOverlayStore, setMapOverlayExternals, MapOverlayProvider } from "../mapOverlayStore";
import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("~/components/map/UserMap", () => ({
  UserMap: "UserMap",
}));

jest.mock("~/hooks/ui", () => ({
  usePanelAnimation: jest.fn(() => ({
    value: { value: 0 },
    setOpen: jest.fn(),
  })),
  useShareModal: jest.fn(() => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
    isOpen: false,
  })),
}));

jest.mock("~/hooks/map", () => ({
  useMapSelectedUser: jest.fn(() => ({
    selectedUser: null,
    selectUser: jest.fn(),
    deselect: jest.fn(),
    stopSharing: jest.fn(),
    mapUserPress: jest.fn(),
    canStopSharing: false,
  })),
}));

describe("mapOverlayStore", () => {
  beforeEach(() => {
    mapOverlayStore.setState({
      users: [],
      currentUserId: undefined,
      showUsersList: true,
      isListExpanded: false,
      showManageModal: false,
      followMode: null,
      focusedCoordinate: null,
      mapTheme: "dark",
      sharingUserIds: [],
      allAvailableUsers: undefined,
      sharingSettings: undefined,
      isRemovingUser: false,
    });
  });

  describe("initial state", () => {
    it("should have empty users array", () => {
      const state = mapOverlayStore.getState();
      expect(state.users).toEqual([]);
    });

    it("should have undefined currentUserId", () => {
      const state = mapOverlayStore.getState();
      expect(state.currentUserId).toBeUndefined();
    });

    it("should have showUsersList as true", () => {
      const state = mapOverlayStore.getState();
      expect(state.showUsersList).toBe(true);
    });

    it("should have isListExpanded as false", () => {
      const state = mapOverlayStore.getState();
      expect(state.isListExpanded).toBe(false);
    });

    it("should have showManageModal as false", () => {
      const state = mapOverlayStore.getState();
      expect(state.showManageModal).toBe(false);
    });

    it("should have followMode as null", () => {
      const state = mapOverlayStore.getState();
      expect(state.followMode).toBeNull();
    });

    it("should have focusedCoordinate as null", () => {
      const state = mapOverlayStore.getState();
      expect(state.focusedCoordinate).toBeNull();
    });

    it("should have mapTheme as dark", () => {
      const state = mapOverlayStore.getState();
      expect(state.mapTheme).toBe("dark");
    });

    it("should have empty sharingUserIds", () => {
      const state = mapOverlayStore.getState();
      expect(state.sharingUserIds).toEqual([]);
    });

    it("should have undefined allAvailableUsers", () => {
      const state = mapOverlayStore.getState();
      expect(state.allAvailableUsers).toBeUndefined();
    });

    it("should have undefined sharingSettings", () => {
      const state = mapOverlayStore.getState();
      expect(state.sharingSettings).toBeUndefined();
    });

    it("should have isRemovingUser as false", () => {
      const state = mapOverlayStore.getState();
      expect(state.isRemovingUser).toBe(false);
    });
  });

  describe("user management actions", () => {
    describe("setUsers", () => {
      it("should set users array", () => {
        const { setUsers } = mapOverlayStore.getState();
        const mockUsers = [
          {
            id: "user-1",
            coordinate: [52.2297, 21.0122] as [number, number],
            name: "John",
            lastActiveAt: Date.now(),
          },
          {
            id: "user-2",
            coordinate: [51.5074, -0.1278] as [number, number],
            name: "Jane",
            lastActiveAt: Date.now(),
          },
        ];

        setUsers(mockUsers);

        expect(mapOverlayStore.getState().users).toEqual(mockUsers);
      });

      it("should set empty users array", () => {
        const { setUsers } = mapOverlayStore.getState();

        setUsers([]);

        expect(mapOverlayStore.getState().users).toEqual([]);
      });
    });

    describe("setCurrentUserId", () => {
      it("should set current user id", () => {
        const { setCurrentUserId } = mapOverlayStore.getState();

        setCurrentUserId("user-123");

        expect(mapOverlayStore.getState().currentUserId).toBe("user-123");
      });

      it("should set current user id to undefined", () => {
        const { setCurrentUserId } = mapOverlayStore.getState();

        setCurrentUserId("user-123");
        setCurrentUserId(undefined);

        expect(mapOverlayStore.getState().currentUserId).toBeUndefined();
      });
    });

    describe("selectUser", () => {
      it("should select user and update related state", () => {
        const { selectUser } = mapOverlayStore.getState();
        const mockUser = {
          id: "user-1",
          coordinate: [52.2297, 21.0122] as [number, number],
          name: "John",
          lastActiveAt: Date.now(),
        };

        selectUser(mockUser);

        const state = mapOverlayStore.getState();
        expect(state.showUsersList).toBe(false);
        expect(state.isListExpanded).toBe(false);
        expect(state.followMode).toBe("user");
        expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
      });
    });

    describe("deselectUser", () => {
      it("should deselect user by clearing followMode", () => {
        const { selectUser, deselectUser } = mapOverlayStore.getState();
        const mockUser = {
          id: "user-1",
          coordinate: [52.2297, 21.0122] as [number, number],
          name: "John",
          lastActiveAt: Date.now(),
        };

        selectUser(mockUser);
        expect(mapOverlayStore.getState().followMode).toBe("user");

        deselectUser();
        expect(mapOverlayStore.getState().followMode).toBeNull();
      });
    });

    describe("backToList", () => {
      it("should return to list view", () => {
        const { selectUser, backToList } = mapOverlayStore.getState();
        const mockUser = {
          id: "user-1",
          coordinate: [52.2297, 21.0122] as [number, number],
          name: "John",
          lastActiveAt: Date.now(),
        };

        selectUser(mockUser);
        backToList();

        const state = mapOverlayStore.getState();
        expect(state.showUsersList).toBe(true);
        expect(state.followMode).toBeNull();
      });
    });
  });

  describe("sharing actions", () => {
    describe("setSharingUserIds", () => {
      it("should set sharing user ids", () => {
        const { setSharingUserIds } = mapOverlayStore.getState();

        setSharingUserIds(["user-1", "user-2", "user-3"]);

        expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-1", "user-2", "user-3"]);
      });

      it("should set empty sharing user ids", () => {
        const { setSharingUserIds } = mapOverlayStore.getState();

        setSharingUserIds([]);

        expect(mapOverlayStore.getState().sharingUserIds).toEqual([]);
      });
    });

    describe("setAllAvailableUsers", () => {
      it("should set available users", () => {
        const { setAllAvailableUsers } = mapOverlayStore.getState();
        const mockUsers = [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ];

        setAllAvailableUsers(mockUsers);

        expect(mapOverlayStore.getState().allAvailableUsers).toEqual(mockUsers);
      });

      it("should set undefined available users", () => {
        const { setAllAvailableUsers } = mapOverlayStore.getState();

        setAllAvailableUsers(undefined);

        expect(mapOverlayStore.getState().allAvailableUsers).toBeUndefined();
      });
    });

    describe("setSharingSettings", () => {
      it("should set sharing settings", () => {
        const { setSharingSettings } = mapOverlayStore.getState();
        const mockSettings = {
          usersToShareWith: [
            { id: "user-1", firstName: "John" },
            { id: "user-2", firstName: "Jane" },
          ],
        };

        setSharingSettings(mockSettings);

        expect(mapOverlayStore.getState().sharingSettings).toEqual(mockSettings);
      });

      it("should set null sharing settings", () => {
        const { setSharingSettings } = mapOverlayStore.getState();

        setSharingSettings(null);

        expect(mapOverlayStore.getState().sharingSettings).toBeNull();
      });
    });

    describe("handleRemoveUser", () => {
      it("should remove user from sharingUserIds", () => {
        const { setSharingUserIds, handleRemoveUser } = mapOverlayStore.getState();

        setSharingUserIds(["user-1", "user-2", "user-3"]);
        handleRemoveUser("user-2");

        expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-1", "user-3"]);
      });

      it("should remove user from sharingSettings.usersToShareWith", () => {
        const { setSharingSettings, setSharingUserIds, handleRemoveUser } =
          mapOverlayStore.getState();

        setSharingUserIds(["user-1", "user-2"]);
        setSharingSettings({
          usersToShareWith: [
            { id: "user-1", firstName: "John" },
            { id: "user-2", firstName: "Jane" },
          ],
        });

        handleRemoveUser("user-1");

        const state = mapOverlayStore.getState();
        expect(state.sharingUserIds).toEqual(["user-2"]);
        expect(state.sharingSettings?.usersToShareWith).toEqual([
          { id: "user-2", firstName: "Jane" },
        ]);
      });

      it("should handle removing non-existent user", () => {
        const { setSharingUserIds, handleRemoveUser } = mapOverlayStore.getState();

        setSharingUserIds(["user-1", "user-2"]);
        handleRemoveUser("user-999");

        expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-1", "user-2"]);
      });

      it("should set isRemovingUser during removal", () => {
        const { setSharingUserIds, handleRemoveUser } = mapOverlayStore.getState();

        setSharingUserIds(["user-1"]);
        handleRemoveUser("user-1");

        expect(mapOverlayStore.getState().isRemovingUser).toBe(false);
      });
    });

    describe("setIsRemovingUser", () => {
      it("should set isRemovingUser to true", () => {
        const { setIsRemovingUser } = mapOverlayStore.getState();

        setIsRemovingUser(true);

        expect(mapOverlayStore.getState().isRemovingUser).toBe(true);
      });

      it("should set isRemovingUser to false", () => {
        const { setIsRemovingUser } = mapOverlayStore.getState();

        setIsRemovingUser(true);
        setIsRemovingUser(false);

        expect(mapOverlayStore.getState().isRemovingUser).toBe(false);
      });
    });
  });

  describe("UI actions", () => {
    describe("toggleListExpansion", () => {
      it("should toggle list expansion", () => {
        const { toggleListExpansion } = mapOverlayStore.getState();

        expect(mapOverlayStore.getState().isListExpanded).toBe(false);

        toggleListExpansion();
        expect(mapOverlayStore.getState().isListExpanded).toBe(true);

        toggleListExpansion();
        expect(mapOverlayStore.getState().isListExpanded).toBe(false);
      });
    });

    describe("collapseList", () => {
      it("should collapse list", () => {
        const { toggleListExpansion, collapseList } = mapOverlayStore.getState();

        toggleListExpansion();
        expect(mapOverlayStore.getState().isListExpanded).toBe(true);

        collapseList();
        expect(mapOverlayStore.getState().isListExpanded).toBe(false);
      });
    });

    describe("setShowManageModal", () => {
      it("should open manage modal", () => {
        const { setShowManageModal } = mapOverlayStore.getState();

        setShowManageModal(true);

        expect(mapOverlayStore.getState().showManageModal).toBe(true);
      });

      it("should close manage modal", () => {
        const { setShowManageModal } = mapOverlayStore.getState();

        setShowManageModal(true);
        setShowManageModal(false);

        expect(mapOverlayStore.getState().showManageModal).toBe(false);
      });
    });

    describe("toggleTheme", () => {
      it("should toggle theme from dark to light", () => {
        const { toggleTheme } = mapOverlayStore.getState();

        expect(mapOverlayStore.getState().mapTheme).toBe("dark");

        toggleTheme();

        expect(mapOverlayStore.getState().mapTheme).toBe("light");
      });

      it("should toggle theme from light to dark", () => {
        const { toggleTheme } = mapOverlayStore.getState();

        toggleTheme();
        toggleTheme();

        expect(mapOverlayStore.getState().mapTheme).toBe("dark");
      });
    });
  });

  describe("map interaction actions", () => {
    describe("setFollowMode", () => {
      it("should set follow mode to user", () => {
        const { setFollowMode } = mapOverlayStore.getState();

        setFollowMode("user");

        expect(mapOverlayStore.getState().followMode).toBe("user");
      });

      it("should set follow mode to null", () => {
        const { setFollowMode } = mapOverlayStore.getState();

        setFollowMode("user");
        setFollowMode(null);

        expect(mapOverlayStore.getState().followMode).toBeNull();
      });
    });

    describe("setFocusedCoordinate", () => {
      it("should set focused coordinate", () => {
        const { setFocusedCoordinate } = mapOverlayStore.getState();

        setFocusedCoordinate([52.2297, 21.0122]);

        expect(mapOverlayStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
      });

      it("should clear focused coordinate", () => {
        const { setFocusedCoordinate } = mapOverlayStore.getState();

        setFocusedCoordinate([52.2297, 21.0122]);
        setFocusedCoordinate(null);

        expect(mapOverlayStore.getState().focusedCoordinate).toBeNull();
      });
    });

    describe("recenter", () => {
      it("should recenter map", () => {
        const { recenter } = mapOverlayStore.getState();

        recenter([52.2297, 21.0122]);

        const state = mapOverlayStore.getState();
        expect(state.followMode).toBeNull();
        expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
      });

      it("should not recenter if coordinate is null", () => {
        const { setFollowMode, recenter } = mapOverlayStore.getState();

        setFollowMode("user");
        recenter(null);

        expect(mapOverlayStore.getState().followMode).toBe("user");
      });
    });

    describe("handleMapUserPress", () => {
      it("should handle map user press", () => {
        const { handleMapUserPress } = mapOverlayStore.getState();
        const mockUser = {
          id: "user-1",
          coordinate: [52.2297, 21.0122] as [number, number],
          name: "John",
          lastActiveAt: Date.now(),
        };

        handleMapUserPress(mockUser);

        const state = mapOverlayStore.getState();
        expect(state.followMode).toBe("user");
        expect(state.focusedCoordinate).toEqual([52.2297, 21.0122]);
      });
    });

    describe("handleMapPress", () => {
      it("should collapse list when expanded", () => {
        const { toggleListExpansion, handleMapPress } = mapOverlayStore.getState();

        toggleListExpansion();
        expect(mapOverlayStore.getState().isListExpanded).toBe(true);

        handleMapPress();
        expect(mapOverlayStore.getState().isListExpanded).toBe(false);
      });

      it("should not change state when list is not expanded", () => {
        const { handleMapPress } = mapOverlayStore.getState();

        handleMapPress();

        expect(mapOverlayStore.getState().isListExpanded).toBe(false);
      });
    });
  });

  describe("complex interactions", () => {
    it("should handle complete user sharing flow", () => {
      const state = mapOverlayStore.getState();

      const mockUsers = [
        {
          id: "user-1",
          coordinate: [52.2297, 21.0122] as [number, number],
          name: "John",
          lastActiveAt: Date.now(),
        },
        {
          id: "user-2",
          coordinate: [51.5074, -0.1278] as [number, number],
          name: "Jane",
          lastActiveAt: Date.now(),
        },
      ];
      state.setUsers(mockUsers);
      expect(mapOverlayStore.getState().users).toEqual(mockUsers);

      state.setSharingUserIds(["user-1", "user-2"]);
      expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-1", "user-2"]);

      state.handleRemoveUser("user-1");
      expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-2"]);
    });

    it("should handle map navigation flow", () => {
      const state = mapOverlayStore.getState();

      const mockUser = {
        id: "user-1",
        coordinate: [52.2297, 21.0122] as [number, number],
        name: "John",
        lastActiveAt: Date.now(),
      };
      state.selectUser(mockUser);

      expect(mapOverlayStore.getState().showUsersList).toBe(false);
      expect(mapOverlayStore.getState().followMode).toBe("user");

      state.backToList();
      expect(mapOverlayStore.getState().showUsersList).toBe(true);
      expect(mapOverlayStore.getState().followMode).toBeNull();

      state.toggleListExpansion();
      expect(mapOverlayStore.getState().isListExpanded).toBe(true);

      state.handleMapPress();
      expect(mapOverlayStore.getState().isListExpanded).toBe(false);
    });
  });

  describe("externals and provider", () => {
    it("should set externals via setMapOverlayExternals", () => {
      const mockUpdateSharing = jest.fn<() => Promise<void>>();
      const mockRemoveUser = jest.fn<(userId: string) => Promise<void>>();

      setMapOverlayExternals({
        updateSharing: mockUpdateSharing,
        removeUser: mockRemoveUser,
        currentCoordinate: [52.2297, 21.0122],
      });

      expect(() => setMapOverlayExternals({})).not.toThrow();
    });

    it("should create MapOverlayProvider element with proper props", () => {
      const mockValue = {
        session: { user: { id: "user-123" } },
        updateSharing: async () => undefined,
        removeUser: async () => undefined,
        currentCoordinate: [52.2297, 21.0122] as [number, number],
      };

      const element = React.createElement(MapOverlayProvider, {
        value: mockValue,
        children: React.createElement("div", null, "test"),
      });

      expect(element).toBeTruthy();
    });
  });

  describe("error handling", () => {
    it("should handle errors in handleRemoveUser gracefully", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
      const { setSharingSettings, handleRemoveUser } = mapOverlayStore.getState();

      setSharingSettings({ usersToShareWith: undefined });

      expect(() => handleRemoveUser("user-1")).not.toThrow();

      consoleSpy.mockRestore();
    });

    it("should handle removing user when sharingSettings is null", () => {
      const { setSharingSettings, setSharingUserIds, handleRemoveUser } =
        mapOverlayStore.getState();

      setSharingUserIds(["user-1", "user-2"]);
      setSharingSettings(null);

      handleRemoveUser("user-1");

      expect(mapOverlayStore.getState().sharingUserIds).toEqual(["user-2"]);
    });
  });
});
