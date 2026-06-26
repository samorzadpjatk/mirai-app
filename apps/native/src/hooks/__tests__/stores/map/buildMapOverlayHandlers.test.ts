import { describe, expect, it, jest } from "@jest/globals";
import type { UserLocation } from "~/components/map/UserMap";
import {
  buildMapOverlayHandlers,
  type MapOverlayHandlerDeps,
  type MapOverlayStore,
  type MapTheme,
  type ShareableUser,
  type SharingSettings,
} from "~/stores/map/mapOverlayStore";

describe("buildMapOverlayHandlers", () => {
  const mockFn = <T extends (...args: any[]) => any>() =>
    jest.fn() as unknown as jest.MockedFunction<T>;

  const baseUser = (overrides?: Partial<UserLocation>): UserLocation => ({
    id: "user-1",
    name: "Alice",
    coordinate: [21, 52],
    lastActiveAt: "2024-01-01",
    ...overrides,
  });

  const createMockStore = (): MapOverlayStore => ({
    users: [],
    currentUserId: undefined,
    showUsersList: true,
    isListExpanded: false,
    showManageModal: false,
    followMode: null,
    focusedCoordinate: null,
    mapTheme: "dark" as MapTheme,
    sharingUserIds: [],
    allAvailableUsers: undefined,
    sharingSettings: undefined,
    isRemovingUser: false,
    selectUser: mockFn<(user: UserLocation) => void>(),
    deselectUser: mockFn<() => void>(),
    backToList: mockFn<() => void>(),
    toggleListExpansion: mockFn<() => void>(),
    collapseList: mockFn<() => void>(),
    setShowManageModal: mockFn<(open: boolean) => void>(),
    setFollowMode: mockFn<(mode: "user" | null) => void>(),
    setFocusedCoordinate: mockFn<(coordinate: [number, number] | null) => void>(),
    toggleTheme: mockFn<() => void>(),
    recenter: mockFn<(currentCoordinate: [number, number] | null) => void>(),
    handleMapUserPress: mockFn<(user: UserLocation) => void>(),
    handleMapPress: mockFn<() => void>(),
    setUsers: mockFn<(users: UserLocation[]) => void>(),
    setCurrentUserId: mockFn<(userId?: string) => void>(),
    setSharingUserIds: mockFn<(ids: string[]) => void>(),
    setAllAvailableUsers: mockFn<(users?: ShareableUser[]) => void>(),
    setSharingSettings: mockFn<(settings?: SharingSettings | null) => void>(),
    setIsRemovingUser: mockFn<(isRemoving: boolean) => void>(),
    handleRemoveUser: mockFn<(userId: string) => void>(),
  });

  const createMockDeps = (
    store: MapOverlayStore,
    overrides?: {
      selectedUserState?: Partial<MapOverlayHandlerDeps["selectedUserState"]>;
      externals?: Partial<MapOverlayHandlerDeps["externals"]>;
      shareModal?: Partial<MapOverlayHandlerDeps["shareModal"]>;
    },
  ): MapOverlayHandlerDeps => ({
    store,
    selectedUserState: {
      selectedUser: null,
      selectUser: mockFn<(user: UserLocation) => void>(),
      deselect: mockFn<() => void>(),
      stopSharing: mockFn<() => Promise<void>>().mockResolvedValue(undefined),
      mapUserPress: mockFn<(user: UserLocation) => void>(),
      canStopSharing: false,
      ...overrides?.selectedUserState,
    },
    externals: {
      removeUser: mockFn<(userId: string) => Promise<void>>().mockResolvedValue(undefined),
      currentCoordinate: [21, 52] as [number, number],
      ...overrides?.externals,
    },
    shareModal: {
      openModal: mockFn<() => void>(),
      ...overrides?.shareModal,
    },
  });

  it("should build handleSelectUser that calls store and state", () => {
    const store = createMockStore();
    const user = baseUser();
    const deps = createMockDeps(store);

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleSelectUser(user);

    expect(deps.selectedUserState.selectUser).toHaveBeenCalledWith(user);
    expect(store.selectUser).toHaveBeenCalledWith(user);
  });

  it("should build handleBackToList that calls deselect and store", () => {
    const store = createMockStore();
    const deps = createMockDeps(store);

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleBackToList();

    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.backToList).toHaveBeenCalled();
  });

  it("should build handleStopSharing that calls stopSharing and backToList", async () => {
    const store = createMockStore();
    const deps = createMockDeps(store);

    const handlers = buildMapOverlayHandlers(deps);
    await handlers.handleStopSharing();

    expect(deps.selectedUserState.stopSharing).toHaveBeenCalled();
    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.backToList).toHaveBeenCalled();
  });

  it("should build handleRecenter that calls store recenter", () => {
    const store = createMockStore();
    const deps = createMockDeps(store);

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleRecenter();

    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.recenter).toHaveBeenCalledWith([21, 52]);
  });

  it("should not recenter when no current coordinate", () => {
    const store = createMockStore();
    const deps = createMockDeps(store, {
      externals: { currentCoordinate: null },
    });

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleRecenter();

    expect(deps.selectedUserState.deselect).not.toHaveBeenCalled();
    expect(store.recenter).not.toHaveBeenCalled();
  });

  it("should build handleRemoveUser that calls external removeUser and store", async () => {
    const store = createMockStore();
    const deps = createMockDeps(store, {
      externals: { currentCoordinate: null },
    });

    const handlers = buildMapOverlayHandlers(deps);
    await handlers.handleRemoveUser("user-1");

    expect(deps.externals.removeUser).toHaveBeenCalledWith("user-1");
    expect(store.handleRemoveUser).toHaveBeenCalledWith("user-1");
  });

  it("should build onAddPress that opens share modal", () => {
    const store = createMockStore();
    const shareModal = { openModal: mockFn<() => void>() };
    const deps = createMockDeps(store, {
      externals: { currentCoordinate: null },
      shareModal,
    });

    const handlers = buildMapOverlayHandlers(deps);
    handlers.onAddPress();

    expect(shareModal.openModal).toHaveBeenCalled();
  });

  it("should build onManagePress that opens manage modal", () => {
    const store = createMockStore();
    const deps = createMockDeps(store, {
      externals: { currentCoordinate: null },
    });

    const handlers = buildMapOverlayHandlers(deps);
    handlers.onManagePress();

    expect(store.setShowManageModal).toHaveBeenCalledWith(true);
  });
});
