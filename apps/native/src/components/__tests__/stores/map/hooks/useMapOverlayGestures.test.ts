import { describe, it, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useMapOverlayGestures } from "~/stores/map/hooks/useMapOverlayGestures";

describe("useMapOverlayGestures", () => {
  const defaultProps = {
    expandValue: { value: 0 },
    panelAnimValue: { value: 0 },
    selectedUser: null,
    showUsersList: true,
    isListExpanded: false,
    toggleListExpansion: jest.fn(),
    listMaxHeight: 300,
  };

  it("initializes with default listDragStart", () => {
    const { result } = renderHook(() => useMapOverlayGestures(...Object.values(defaultProps) as any));
    expect(result.current.listDragStart.value).toBe(0);
  });

  it("returns a pan gesture object", () => {
    const { result } = renderHook(() => useMapOverlayGestures(...Object.values(defaultProps) as any));
    expect(result.current.panGesture).toBeDefined();
  });

  it("returns panel animated style", () => {
    const { result } = renderHook(() => useMapOverlayGestures(...Object.values(defaultProps) as any));
    expect(result.current.panelStyle).toBeDefined();
  });

  it("returns users list animated style", () => {
    const { result } = renderHook(() => useMapOverlayGestures(...Object.values(defaultProps) as any));
    expect(result.current.usersListStyle).toBeDefined();
  });

  it("accepts custom listMaxHeight", () => {
    const customProps = { ...defaultProps, listMaxHeight: 500 };
    const { result } = renderHook(() => useMapOverlayGestures(...Object.values(customProps) as any));
    expect(result.current.usersListStyle).toBeDefined();
  });
});
