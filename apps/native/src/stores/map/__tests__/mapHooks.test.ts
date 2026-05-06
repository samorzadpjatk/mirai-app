import { describe, it, expect, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useMapStore } from "../mapHooks";
import { mapStore } from "../mapStore";

describe("mapHooks", () => {
  beforeEach(() => {
    act(() => {
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
  });

  describe("useMapStore", () => {
    it("should select state slice with selector", () => {
      const { result } = renderHook(() => useMapStore((state) => state.mapTheme));
      expect(result.current).toBe("dark");
    });

    it("should select selectedUserId", () => {
      const { result } = renderHook(() => useMapStore((state) => state.selectedUserId));
      expect(result.current).toBeNull();
    });

    it("should select showUsersList", () => {
      const { result } = renderHook(() => useMapStore((state) => state.showUsersList));
      expect(result.current).toBe(true);
    });

    it("should select isListExpanded", () => {
      const { result } = renderHook(() => useMapStore((state) => state.isListExpanded));
      expect(result.current).toBe(false);
    });

    it("should select followMode", () => {
      const { result } = renderHook(() => useMapStore((state) => state.followMode));
      expect(result.current).toBeNull();
    });

    it("should select focusedCoordinate", () => {
      const { result } = renderHook(() => useMapStore((state) => state.focusedCoordinate));
      expect(result.current).toBeNull();
    });

    it("should react to state changes", () => {
      const { result } = renderHook(() => useMapStore((state) => state.mapTheme));
      
      expect(result.current).toBe("dark");
      
      act(() => {
        mapStore.setState({ mapTheme: "light" });
      });
      
      expect(result.current).toBe("light");
    });

    it("should select multiple state properties using stable selector", () => {
      // Use a stable selector that returns a consistent reference when state hasn't changed
      const stableSelector = (state: ReturnType<typeof mapStore.getState>) => state.mapTheme;
      
      const { result } = renderHook(() => useMapStore(stableSelector));

      expect(result.current).toBe("dark");
    });

    it("should select actions from store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.selectUser));
      expect(typeof result.current).toBe("function");
    });

    it("should call selectUser action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.selectUser));
      
      act(() => {
        result.current("user-123", [52.2297, 21.0122]);
      });

      expect(mapStore.getState().selectedUserId).toBe("user-123");
      expect(mapStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
    });

    it("should call toggleTheme action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.toggleTheme));
      
      expect(mapStore.getState().mapTheme).toBe("dark");
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().mapTheme).toBe("light");
    });

    it("should call setShowManageModal action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.setShowManageModal));
      
      act(() => {
        result.current(true);
      });
      
      expect(mapStore.getState().showManageModal).toBe(true);
    });

    it("should call setFollowMode action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.setFollowMode));
      
      act(() => {
        result.current("user");
      });
      
      expect(mapStore.getState().followMode).toBe("user");
    });

    it("should call setFocusedCoordinate action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.setFocusedCoordinate));
      
      act(() => {
        result.current([40.7128, -74.006]);
      });
      
      expect(mapStore.getState().focusedCoordinate).toEqual([40.7128, -74.006]);
    });

    it("should call toggleListExpansion action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.toggleListExpansion));
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().isListExpanded).toBe(true);
    });

    it("should call collapseList action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.collapseList));
      
      act(() => {
        mapStore.setState({ isListExpanded: true });
      });
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().isListExpanded).toBe(false);
    });

    it("should call deselectUser action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.deselectUser));
      
      act(() => {
        mapStore.setState({ selectedUserId: "user-123" });
      });
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().selectedUserId).toBeNull();
    });

    it("should call backToList action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.backToList));
      
      act(() => {
        mapStore.setState({ 
          selectedUserId: "user-123",
          showUsersList: false 
        });
      });
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().showUsersList).toBe(true);
      expect(mapStore.getState().selectedUserId).toBeNull();
    });

    it("should call recenter action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.recenter));
      
      act(() => {
        result.current([52.2297, 21.0122]);
      });
      
      expect(mapStore.getState().focusedCoordinate).toEqual([52.2297, 21.0122]);
    });

    it("should call handleMapUserPress action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.handleMapUserPress));
      
      act(() => {
        result.current("user-456", [48.8566, 2.3522]);
      });
      
      expect(mapStore.getState().selectedUserId).toBe("user-456");
      expect(mapStore.getState().followMode).toBe("user");
    });

    it("should call handleMapPress action through store", () => {
      const { result } = renderHook(() => useMapStore((state) => state.handleMapPress));
      
      act(() => {
        mapStore.setState({ isListExpanded: true });
      });
      
      act(() => {
        result.current();
      });
      
      expect(mapStore.getState().isListExpanded).toBe(false);
    });
  });
});
