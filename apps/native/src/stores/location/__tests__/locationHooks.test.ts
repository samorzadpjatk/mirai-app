import { describe, it, expect, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useLocationContext, useLocationStore } from "../locationHooks";
import { locationStore } from "../locationStore";

describe("locationHooks", () => {
  beforeEach(() => {
    act(() => {
      locationStore.setState({
        isLocationSharingEnabled: false,
        permissionStatus: "undetermined",
        backgroundPermissionStatus: "undetermined",
        isBackgroundLocationEnabled: false,
        isBackgroundLocationActive: false,
        isLoading: false,
        isUpdatingSharing: false,
        isUpdatingBackgroundLocation: false,
      });
    });
  });

  describe("useLocationContext", () => {
    it("should return full location state with computed properties", () => {
      const { result } = renderHook(() => useLocationContext());

      expect(result.current.isLocationSharingEnabled).toBe(false);
      expect(result.current.permissionStatus).toBe("undetermined");
      expect(result.current.canViewOthersLocations).toBe(false);
      expect(result.current.canShareOwnLocation).toBe(false);
    });

    it("should compute canViewOthersLocations as true when sharing enabled and granted", () => {
      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "granted",
        });
      });

      const { result } = renderHook(() => useLocationContext());

      expect(result.current.canViewOthersLocations).toBe(true);
      expect(result.current.canShareOwnLocation).toBe(true);
    });

    it("should compute canViewOthersLocations as false when sharing disabled", () => {
      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: false,
          permissionStatus: "granted",
        });
      });

      const { result } = renderHook(() => useLocationContext());

      expect(result.current.canViewOthersLocations).toBe(false);
      expect(result.current.canShareOwnLocation).toBe(false);
    });

    it("should compute canViewOthersLocations as false when permission denied", () => {
      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "denied",
        });
      });

      const { result } = renderHook(() => useLocationContext());

      expect(result.current.canViewOthersLocations).toBe(false);
      expect(result.current.canShareOwnLocation).toBe(false);
    });

    it("should include all state properties", () => {
      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "granted",
          backgroundPermissionStatus: "granted",
          isBackgroundLocationEnabled: true,
          isBackgroundLocationActive: true,
          isLoading: false,
          isUpdatingSharing: false,
          isUpdatingBackgroundLocation: false,
        });
      });

      const { result } = renderHook(() => useLocationContext());

      expect(result.current.isLocationSharingEnabled).toBe(true);
      expect(result.current.permissionStatus).toBe("granted");
      expect(result.current.backgroundPermissionStatus).toBe("granted");
      expect(result.current.isBackgroundLocationEnabled).toBe(true);
      expect(result.current.isBackgroundLocationActive).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUpdatingSharing).toBe(false);
      expect(result.current.isUpdatingBackgroundLocation).toBe(false);
    });

    it("should include all actions", () => {
      const { result } = renderHook(() => useLocationContext());

      expect(typeof result.current.hydrate).toBe("function");
      expect(typeof result.current.syncBackgroundTask).toBe("function");
      expect(typeof result.current.requestLocationPermissions).toBe("function");
      expect(typeof result.current.toggleLocationSharing).toBe("function");
      expect(typeof result.current.toggleBackgroundLocationUpdates).toBe("function");
      expect(typeof result.current.openSystemLocationSettings).toBe("function");
    });

    it("should react to state changes", () => {
      const { result } = renderHook(() => useLocationContext());

      expect(result.current.isLocationSharingEnabled).toBe(false);
      expect(result.current.canViewOthersLocations).toBe(false);

      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "granted",
        });
      });

      expect(result.current.isLocationSharingEnabled).toBe(true);
      expect(result.current.canViewOthersLocations).toBe(true);
    });
  });

  describe("useLocationStore", () => {
    it("should select state slice with selector", () => {
      const { result } = renderHook(() =>
        useLocationStore((state) => state.isLocationSharingEnabled),
      );

      expect(result.current).toBe(false);
    });

    it("should select permission status", () => {
      act(() => {
        locationStore.setState({ permissionStatus: "granted" });
      });

      const { result } = renderHook(() => useLocationStore((state) => state.permissionStatus));

      expect(result.current).toBe("granted");
    });

    it("should select background location state", () => {
      act(() => {
        locationStore.setState({
          isBackgroundLocationEnabled: true,
          isBackgroundLocationActive: true,
        });
      });

      const { result: enabledResult } = renderHook(() =>
        useLocationStore((state) => state.isBackgroundLocationEnabled),
      );
      const { result: activeResult } = renderHook(() =>
        useLocationStore((state) => state.isBackgroundLocationActive),
      );

      expect(enabledResult.current).toBe(true);
      expect(activeResult.current).toBe(true);
    });

    it("should select loading states", () => {
      act(() => {
        locationStore.setState({
          isLoading: true,
          isUpdatingSharing: true,
          isUpdatingBackgroundLocation: false,
        });
      });

      const { result: loadingResult } = renderHook(() =>
        useLocationStore((state) => state.isLoading),
      );
      const { result: updatingSharingResult } = renderHook(() =>
        useLocationStore((state) => state.isUpdatingSharing),
      );
      const { result: updatingBackgroundResult } = renderHook(() =>
        useLocationStore((state) => state.isUpdatingBackgroundLocation),
      );

      expect(loadingResult.current).toBe(true);
      expect(updatingSharingResult.current).toBe(true);
      expect(updatingBackgroundResult.current).toBe(false);
    });

    it("should select actions from store", () => {
      const { result } = renderHook(() => useLocationStore((state) => state.toggleLocationSharing));

      expect(typeof result.current).toBe("function");
    });

    it("should react to state changes", () => {
      const { result } = renderHook(() =>
        useLocationStore((state) => state.isLocationSharingEnabled),
      );

      expect(result.current).toBe(false);

      act(() => {
        locationStore.setState({ isLocationSharingEnabled: true });
      });

      expect(result.current).toBe(true);
    });

    it("should allow calling actions through selector", async () => {
      const { result: toggleResult } = renderHook(() =>
        useLocationStore((state) => state.toggleLocationSharing),
      );
      const { result: enabledResult } = renderHook(() =>
        useLocationStore((state) => state.isLocationSharingEnabled),
      );

      expect(enabledResult.current).toBe(false);

      await act(async () => {
        await toggleResult.current();
      });

      expect(locationStore.getState().isLocationSharingEnabled).toBe(true);
    });
  });

  describe("hook integration", () => {
    it("should work together for complex scenarios", () => {
      const { result: contextResult } = renderHook(() => useLocationContext());
      const { result: storeResult } = renderHook(() =>
        useLocationStore((state) => state.permissionStatus),
      );

      expect(contextResult.current.canViewOthersLocations).toBe(false);
      expect(storeResult.current).toBe("undetermined");

      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "granted",
        });
      });

      expect(contextResult.current.canViewOthersLocations).toBe(true);
      expect(storeResult.current).toBe("granted");
    });

    it("should handle permission state transitions", () => {
      const { result } = renderHook(() => useLocationContext());

      act(() => {
        locationStore.setState({
          isLocationSharingEnabled: true,
          permissionStatus: "undetermined",
        });
      });
      expect(result.current.canViewOthersLocations).toBe(false);

      act(() => {
        locationStore.setState({ permissionStatus: "granted" });
      });
      expect(result.current.canViewOthersLocations).toBe(true);

      act(() => {
        locationStore.setState({ permissionStatus: "denied" });
      });
      expect(result.current.canViewOthersLocations).toBe(false);
    });
  });
});
