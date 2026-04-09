import { describe, expect, test, beforeEach } from "bun:test";
import { mapStore, type MapUserLocation, type MapTheme } from "../mapStore";

const resetStore = () => {
  mapStore.setState({
    selectedUserId: null,
    showUsersList: true,
    isListExpanded: false,
    showManageModal: false,
    followMode: null,
    focusedCoordinate: null,
    mapTheme: "dark",
  });
};

beforeEach(() => {
  resetStore();
});

const createMockCoordinate = (lat: number, lng: number): [number, number] => [
  lat,
  lng,
];

describe("[UNIT] mapStore initial state", () => {
  test("has correct initial state values", () => {
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

describe("[UNIT] mapStore selectUser action", () => {
  test("selects a user and updates related state", () => {
    const { selectUser } = mapStore.getState();
    const coordinate = createMockCoordinate(52.2297, 21.0122);

    selectUser("user-123", coordinate);

    const state = mapStore.getState();
    expect(state.selectedUserId).toBe("user-123");
    expect(state.showUsersList).toBe(false);
    expect(state.isListExpanded).toBe(false);
    expect(state.followMode).toBe("user");
    expect(state.focusedCoordinate).toEqual(coordinate);
  });

  test("selects different user sequentially", () => {
    const { selectUser } = mapStore.getState();

    selectUser("user-1", createMockCoordinate(52.0, 21.0));
    expect(mapStore.getState().selectedUserId).toBe("user-1");

    selectUser("user-2", createMockCoordinate(53.0, 22.0));
    expect(mapStore.getState().selectedUserId).toBe("user-2");
  });

  test("updates focused coordinate when selecting user", () => {
    const { selectUser } = mapStore.getState();
    const coord1 = createMockCoordinate(52.2297, 21.0122);
    const coord2 = createMockCoordinate(40.7128, -74.006);

    selectUser("user-1", coord1);
    expect(mapStore.getState().focusedCoordinate).toEqual(coord1);

    selectUser("user-2", coord2);
    expect(mapStore.getState().focusedCoordinate).toEqual(coord2);
  });
});

describe("[UNIT] mapStore deselectUser action", () => {
  test("deselects the currently selected user", () => {
    const { selectUser, deselectUser } = mapStore.getState();

    selectUser("user-123", createMockCoordinate(52.2297, 21.0122));
    expect(mapStore.getState().selectedUserId).toBe("user-123");

    deselectUser();

    const state = mapStore.getState();
    expect(state.selectedUserId).toBeNull();
  });

  test("does nothing when no user is selected", () => {
    const { deselectUser } = mapStore.getState();

    expect(mapStore.getState().selectedUserId).toBeNull();
    deselectUser();
    expect(mapStore.getState().selectedUserId).toBeNull();
  });

  test("preserves other state when deselecting", () => {
    const { selectUser, deselectUser, setShowManageModal } =
      mapStore.getState();

    selectUser("user-123", createMockCoordinate(52.2297, 21.0122));
    setShowManageModal(true);

    deselectUser();

    const state = mapStore.getState();
    expect(state.selectedUserId).toBeNull();
    expect(state.showManageModal).toBe(true);
    expect(state.mapTheme).toBe("dark");
  });
});

describe("[UNIT] mapStore backToList action", () => {
  test("returns to list view from user selection", () => {
    const { selectUser, backToList } = mapStore.getState();

    selectUser("user-123", createMockCoordinate(52.2297, 21.0122));
    expect(mapStore.getState().showUsersList).toBe(false);

    backToList();

    const state = mapStore.getState();
    expect(state.selectedUserId).toBeNull();
    expect(state.showUsersList).toBe(true);
  });

  test("works when already in list view", () => {
    const { backToList } = mapStore.getState();

    expect(mapStore.getState().showUsersList).toBe(true);

    backToList();

    const state = mapStore.getState();
    expect(state.showUsersList).toBe(true);
    expect(state.selectedUserId).toBeNull();
  });
});

describe("[UNIT] mapStore toggleListExpansion action", () => {
  test("expands the list when collapsed", () => {
    const { toggleListExpansion } = mapStore.getState();

    expect(mapStore.getState().isListExpanded).toBe(false);

    toggleListExpansion();

    expect(mapStore.getState().isListExpanded).toBe(true);
  });

  test("collapses the list when expanded", () => {
    const { toggleListExpansion } = mapStore.getState();

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);

    toggleListExpansion();

    expect(mapStore.getState().isListExpanded).toBe(false);
  });

  test("toggles multiple times correctly", () => {
    const { toggleListExpansion } = mapStore.getState();

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(false);

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);
  });
});

describe("[UNIT] mapStore collapseList action", () => {
  test("collapses an expanded list", () => {
    const { toggleListExpansion, collapseList } = mapStore.getState();

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);

    collapseList();

    expect(mapStore.getState().isListExpanded).toBe(false);
  });

  test("keeps list collapsed when already collapsed", () => {
    const { collapseList } = mapStore.getState();

    expect(mapStore.getState().isListExpanded).toBe(false);

    collapseList();

    expect(mapStore.getState().isListExpanded).toBe(false);
  });
});

describe("[UNIT] mapStore setShowManageModal action", () => {
  test("opens the manage modal", () => {
    const { setShowManageModal } = mapStore.getState();

    setShowManageModal(true);

    expect(mapStore.getState().showManageModal).toBe(true);
  });

  test("closes the manage modal", () => {
    const { setShowManageModal } = mapStore.getState();

    setShowManageModal(true);
    expect(mapStore.getState().showManageModal).toBe(true);

    setShowManageModal(false);

    expect(mapStore.getState().showManageModal).toBe(false);
  });

  test("toggles manage modal state", () => {
    const { setShowManageModal } = mapStore.getState();

    setShowManageModal(true);
    expect(mapStore.getState().showManageModal).toBe(true);

    setShowManageModal(false);
    expect(mapStore.getState().showManageModal).toBe(false);

    setShowManageModal(true);
    expect(mapStore.getState().showManageModal).toBe(true);
  });
});

describe("[UNIT] mapStore setFollowMode action", () => {
  test("sets follow mode to user", () => {
    const { setFollowMode } = mapStore.getState();

    setFollowMode("user");

    expect(mapStore.getState().followMode).toBe("user");
  });

  test("clears follow mode", () => {
    const { setFollowMode } = mapStore.getState();

    setFollowMode("user");
    expect(mapStore.getState().followMode).toBe("user");

    setFollowMode(null);

    expect(mapStore.getState().followMode).toBeNull();
  });

  test("switches between modes", () => {
    const { setFollowMode } = mapStore.getState();

    setFollowMode("user");
    expect(mapStore.getState().followMode).toBe("user");

    setFollowMode(null);
    expect(mapStore.getState().followMode).toBeNull();

    setFollowMode("user");
    expect(mapStore.getState().followMode).toBe("user");
  });
});

describe("[UNIT] mapStore setFocusedCoordinate action", () => {
  test("sets focused coordinate", () => {
    const { setFocusedCoordinate } = mapStore.getState();
    const coordinate = createMockCoordinate(52.2297, 21.0122);

    setFocusedCoordinate(coordinate);

    expect(mapStore.getState().focusedCoordinate).toEqual(coordinate);
  });

  test("updates focused coordinate", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    setFocusedCoordinate(createMockCoordinate(52.2297, 21.0122));
    expect(mapStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);

    setFocusedCoordinate(createMockCoordinate(40.7128, -74.006));
    expect(mapStore.getState().focusedCoordinate).toEqual([40.7128, -74.006]);
  });

  test("clears focused coordinate", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    setFocusedCoordinate(createMockCoordinate(52.2297, 21.0122));
    expect(mapStore.getState().focusedCoordinate).not.toBeNull();

    setFocusedCoordinate(null);

    expect(mapStore.getState().focusedCoordinate).toBeNull();
  });

  test("handles coordinates with negative values", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    setFocusedCoordinate(createMockCoordinate(-33.8688, 151.2093));

    expect(mapStore.getState().focusedCoordinate).toEqual([-33.8688, 151.2093]);
  });

  test("handles coordinates at zero", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    setFocusedCoordinate(createMockCoordinate(0, 0));

    expect(mapStore.getState().focusedCoordinate).toEqual([0, 0]);
  });
});

describe("[UNIT] mapStore toggleTheme action", () => {
  test("toggles from dark to light", () => {
    const { toggleTheme } = mapStore.getState();

    expect(mapStore.getState().mapTheme).toBe("dark");

    toggleTheme();

    expect(mapStore.getState().mapTheme).toBe("light");
  });

  test("toggles from light to dark", () => {
    const { toggleTheme } = mapStore.getState();

    toggleTheme();
    expect(mapStore.getState().mapTheme).toBe("light");

    toggleTheme();

    expect(mapStore.getState().mapTheme).toBe("dark");
  });

  test("toggles theme multiple times", () => {
    const { toggleTheme } = mapStore.getState();

    toggleTheme();
    expect(mapStore.getState().mapTheme).toBe("light");

    toggleTheme();
    expect(mapStore.getState().mapTheme).toBe("dark");

    toggleTheme();
    expect(mapStore.getState().mapTheme).toBe("light");
  });
});

describe("[UNIT] mapStore recenter action", () => {
  test("recenters map to current coordinate", () => {
    const { selectUser, recenter } = mapStore.getState();
    const userCoord = createMockCoordinate(52.2297, 21.0122);
    const currentCoord = createMockCoordinate(52.23, 21.0125);

    selectUser("user-123", userCoord);
    expect(mapStore.getState().selectedUserId).toBe("user-123");

    recenter(currentCoord);

    const state = mapStore.getState();
    expect(state.selectedUserId).toBeNull();
    expect(state.focusedCoordinate).toEqual(currentCoord);
  });

  test("does nothing when coordinate is null", () => {
    const { selectUser, recenter } = mapStore.getState();
    const userCoord = createMockCoordinate(52.2297, 21.0122);

    selectUser("user-123", userCoord);
    expect(mapStore.getState().selectedUserId).toBe("user-123");

    recenter(null);

    const state = mapStore.getState();
    expect(state.selectedUserId).toBe("user-123");
    expect(state.focusedCoordinate).toEqual(userCoord);
  });

  test("updates focused coordinate while deselecting user", () => {
    const { recenter } = mapStore.getState();
    const newCoord = createMockCoordinate(40.7128, -74.006);

    recenter(newCoord);

    const state = mapStore.getState();
    expect(state.selectedUserId).toBeNull();
    expect(state.focusedCoordinate).toEqual(newCoord);
  });
});

describe("[UNIT] mapStore handleMapUserPress action", () => {
  test("selects user on map press", () => {
    const { handleMapUserPress } = mapStore.getState();
    const coordinate = createMockCoordinate(52.2297, 21.0122);

    handleMapUserPress("user-123", coordinate);

    const state = mapStore.getState();
    expect(state.selectedUserId).toBe("user-123");
    expect(state.followMode).toBe("user");
    expect(state.focusedCoordinate).toEqual(coordinate);
  });

  test("switches to different user on press", () => {
    const { handleMapUserPress } = mapStore.getState();

    handleMapUserPress("user-1", createMockCoordinate(52.0, 21.0));
    expect(mapStore.getState().selectedUserId).toBe("user-1");

    handleMapUserPress("user-2", createMockCoordinate(53.0, 22.0));

    const state = mapStore.getState();
    expect(state.selectedUserId).toBe("user-2");
    expect(state.focusedCoordinate).toEqual([53.0, 22.0]);
  });
});

describe("[UNIT] mapStore handleMapPress action", () => {
  test("collapses expanded list on map press", () => {
    const { toggleListExpansion, handleMapPress } = mapStore.getState();

    toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);

    handleMapPress();

    expect(mapStore.getState().isListExpanded).toBe(false);
  });

  test("does nothing when list is already collapsed", () => {
    const { handleMapPress } = mapStore.getState();

    expect(mapStore.getState().isListExpanded).toBe(false);

    handleMapPress();

    expect(mapStore.getState().isListExpanded).toBe(false);
  });

  test("preserves other state on map press", () => {
    const { selectUser, toggleListExpansion, handleMapPress } =
      mapStore.getState();

    selectUser("user-123", createMockCoordinate(52.2297, 21.0122));
    toggleListExpansion();

    handleMapPress();

    const state = mapStore.getState();
    expect(state.selectedUserId).toBe("user-123");
    expect(state.isListExpanded).toBe(false);
    expect(state.followMode).toBe("user");
  });
});

describe("[UNIT] mapStore workflow simulations", () => {
  test("complete user selection and navigation workflow", () => {
    const state = mapStore.getState();

    // User opens map and sees list
    expect(state.showUsersList).toBe(true);

    // User taps on a user on the map (note: handleMapUserPress doesn't hide list)
    state.handleMapUserPress(
      "user-456",
      createMockCoordinate(52.2297, 21.0122),
    );

    const afterPress = mapStore.getState();
    expect(afterPress.selectedUserId).toBe("user-456");
    expect(afterPress.showUsersList).toBe(true); // handleMapUserPress doesn't change this
    expect(afterPress.followMode).toBe("user");

    // User goes back to list
    state.backToList();

    const afterBack = mapStore.getState();
    expect(afterBack.selectedUserId).toBeNull();
    expect(afterBack.showUsersList).toBe(true);

    // User expands list
    state.toggleListExpansion();
    expect(mapStore.getState().isListExpanded).toBe(true);

    // User taps on map to collapse list
    state.handleMapPress();
    expect(mapStore.getState().isListExpanded).toBe(false);
  });

  test("theme switching workflow", () => {
    const { toggleTheme, setShowManageModal } = mapStore.getState();

    // Initial dark theme
    expect(mapStore.getState().mapTheme).toBe("dark");

    // User opens manage modal and switches theme
    setShowManageModal(true);
    toggleTheme();

    const state = mapStore.getState();
    expect(state.mapTheme).toBe("light");
    expect(state.showManageModal).toBe(true);

    // User toggles again
    toggleTheme();
    expect(mapStore.getState().mapTheme).toBe("dark");
  });

  test("follow mode and recenter workflow", () => {
    const state = mapStore.getState();

    // Select a user to follow
    state.selectUser("user-789", createMockCoordinate(52.2297, 21.0122));
    expect(mapStore.getState().followMode).toBe("user");

    // Stop following
    state.setFollowMode(null);
    expect(mapStore.getState().followMode).toBeNull();

    // Recenter to current location
    state.recenter(createMockCoordinate(52.23, 21.0125));

    const afterRecenter = mapStore.getState();
    expect(afterRecenter.selectedUserId).toBeNull();
    expect(afterRecenter.focusedCoordinate).toEqual([52.23, 21.0125]);
  });

  test("rapid user switching workflow", () => {
    const { handleMapUserPress } = mapStore.getState();

    const users = [
      { id: "user-1", coord: createMockCoordinate(52.0, 21.0) },
      { id: "user-2", coord: createMockCoordinate(52.1, 21.1) },
      { id: "user-3", coord: createMockCoordinate(52.2, 21.2) },
    ];

    users.forEach((user) => {
      handleMapUserPress(user.id, user.coord);
      expect(mapStore.getState().selectedUserId).toBe(user.id);
      expect(mapStore.getState().focusedCoordinate).toEqual(user.coord);
    });
  });
});

describe("[UNIT] mapStore edge cases", () => {
  test("handles special characters in user IDs", () => {
    const { selectUser } = mapStore.getState();

    const specialIds = [
      "user-with-dashes",
      "user_with_underscores",
      "user.with.dots",
      "user:uuid:123",
      "user/uuid/123",
    ];

    specialIds.forEach((id) => {
      selectUser(id, createMockCoordinate(52.0, 21.0));
      expect(mapStore.getState().selectedUserId).toBe(id);
    });
  });

  test("handles very long user IDs", () => {
    const { selectUser } = mapStore.getState();

    const longId = "user-" + "a".repeat(1000);
    selectUser(longId, createMockCoordinate(52.0, 21.0));

    expect(mapStore.getState().selectedUserId).toBe(longId);
  });

  test("handles extreme coordinates", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    const extremeCoords: [number, number][] = [
      [90, 180], // Max lat, max lng
      [-90, -180], // Min lat, min lng
      [0, 0], // Origin
      [85, 179], // Near poles
      [-85, -179],
    ];

    extremeCoords.forEach((coord) => {
      setFocusedCoordinate(coord);
      expect(mapStore.getState().focusedCoordinate).toEqual(coord);
    });
  });

  test("handles floating point precision coordinates", () => {
    const { setFocusedCoordinate } = mapStore.getState();

    const preciseCoord: [number, number] = [
      52.22967562341234, 21.01222867345123,
    ];
    setFocusedCoordinate(preciseCoord);

    expect(mapStore.getState().focusedCoordinate).toEqual(preciseCoord);
  });
});
