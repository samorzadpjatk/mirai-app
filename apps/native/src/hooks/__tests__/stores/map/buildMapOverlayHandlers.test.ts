import { describe, it, expect, jest } from "@jest/globals";
import { buildMapOverlayHandlers } from "~/stores/map/mapOverlayStore";

describe("buildMapOverlayHandlers", () => {
  const createMockStore = () => ({
    selectUser: jest.fn(),
    handleMapUserPress: jest.fn(),
    backToList: jest.fn(),
    recenter: jest.fn(),
    handleRemoveUser: jest.fn(),
    setShowManageModal: jest.fn(),
    toggleListExpansion: jest.fn(),
    handleMapPress: jest.fn(),
  });

  it("should build handleSelectUser that calls store and state", () => {
    const store = createMockStore();
    const user = { id: "user-1", name: "Alice", coordinate: [21, 52] as [number, number] };
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: [21, 52] as [number, number],
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleSelectUser(user);

    expect(deps.selectedUserState.selectUser).toHaveBeenCalledWith(user);
    expect(store.selectUser).toHaveBeenCalledWith(user);
  });

  it("should build handleBackToList that calls deselect and store", () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: [21, 52] as [number, number],
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleBackToList();

    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.backToList).toHaveBeenCalled();
  });

  it("should build handleStopSharing that calls stopSharing and backToList", async () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: [21, 52] as [number, number],
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    await handlers.handleStopSharing();

    expect(deps.selectedUserState.stopSharing).toHaveBeenCalled();
    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.backToList).toHaveBeenCalled();
  });

  it("should build handleRecenter that calls store recenter", () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: [21, 52] as [number, number],
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleRecenter();

    expect(deps.selectedUserState.deselect).toHaveBeenCalled();
    expect(store.recenter).toHaveBeenCalledWith([21, 52]);
  });

  it("should not recenter when no current coordinate", () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: null,
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.handleRecenter();

    expect(deps.selectedUserState.deselect).not.toHaveBeenCalled();
    expect(store.recenter).not.toHaveBeenCalled();
  });

  it("should build handleRemoveUser that calls external removeUser and store", async () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: null,
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    await handlers.handleRemoveUser("user-1");

    expect(deps.externals.removeUser).toHaveBeenCalledWith("user-1");
    expect(store.handleRemoveUser).toHaveBeenCalledWith("user-1");
  });

  it("should build onAddPress that opens share modal", () => {
    const store = createMockStore();
    const shareModal = { openModal: jest.fn() };
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: null,
      },
      shareModal,
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.onAddPress();

    expect(shareModal.openModal).toHaveBeenCalled();
  });

  it("should build onManagePress that opens manage modal", () => {
    const store = createMockStore();
    const deps = {
      store: store as unknown as import("../../stores/map/mapOverlayStore").MapOverlayStore,
      selectedUserState: {
        selectedUser: null,
        selectUser: jest.fn(),
        deselect: jest.fn(),
        stopSharing: jest.fn().mockResolvedValue(undefined),
        mapUserPress: jest.fn(),
        canStopSharing: false,
      },
      externals: {
        removeUser: jest.fn().mockResolvedValue(undefined),
        currentCoordinate: null,
      },
      shareModal: { openModal: jest.fn() },
    };

    const handlers = buildMapOverlayHandlers(deps);
    handlers.onManagePress();

    expect(store.setShowManageModal).toHaveBeenCalledWith(true);
  });
});
