import { describe, it, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useMapOverlayGestures } from "~/stores/map/hooks/useMapOverlayGestures";

describe("useMapOverlayGestures", () => {
  const expandValue = { value: 0 };
  const panelAnimValue = { value: 0 };
  const selectedUser = null;
  const showUsersList = true;
  const isListExpanded = false;
  const toggleListExpansion = jest.fn();
  const listMaxHeight = 300;

  it("initializes with default listDragStart", () => {
    const { result } = renderHook(() =>
      useMapOverlayGestures(expandValue, panelAnimValue, selectedUser, showUsersList, isListExpanded, toggleListExpansion, listMaxHeight),
    );
    expect(result.current.listDragStart.value).toBe(0);
  });

  it("returns a pan gesture object", () => {
    const { result } = renderHook(() =>
      useMapOverlayGestures(expandValue, panelAnimValue, selectedUser, showUsersList, isListExpanded, toggleListExpansion, listMaxHeight),
    );
    expect(result.current.panGesture).toBeDefined();
  });

  it("returns panel animated style", () => {
    const { result } = renderHook(() =>
      useMapOverlayGestures(expandValue, panelAnimValue, selectedUser, showUsersList, isListExpanded, toggleListExpansion, listMaxHeight),
    );
    expect(result.current.panelStyle).toBeDefined();
  });

  it("returns users list animated style", () => {
    const { result } = renderHook(() =>
      useMapOverlayGestures(expandValue, panelAnimValue, selectedUser, showUsersList, isListExpanded, toggleListExpansion, listMaxHeight),
    );
    expect(result.current.usersListStyle).toBeDefined();
  });

  it("accepts custom listMaxHeight", () => {
    const { result } = renderHook(() =>
      useMapOverlayGestures(expandValue, panelAnimValue, selectedUser, showUsersList, isListExpanded, toggleListExpansion, 500),
    );
    expect(result.current.usersListStyle).toBeDefined();
  });
});
