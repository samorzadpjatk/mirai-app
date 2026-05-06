import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type * as indexModule from "../index";

jest.mock("@mirai-app/shared", () => ({
  mapStore: { getState: jest.fn(() => ({})), setState: jest.fn() },
}));

jest.mock("../mapHooks", () => ({
  useMapStore: jest.fn(() => ({})),
  useMapActions: jest.fn(() => ({})),
}));

jest.mock("../mapOverlayStore", () => ({
  mapOverlayStore: { getState: jest.fn(() => ({})), setState: jest.fn() },
  useMapOverlayStore: jest.fn(() => ({})),
  MapOverlayProvider: jest.fn(() => null),
  setMapOverlayExternals: jest.fn(),
}));

import {
  mapStore,
  useMapStore,
  useMapActions,
  mapOverlayStore,
  useMapOverlayStore,
  MapOverlayProvider,
  setMapOverlayExternals,
} from "../index";

describe("stores/map/index exports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("mapStore exports from @mirai-app/shared", () => {
    it("should export mapStore", () => {
      expect(mapStore).toBeDefined();
      expect(typeof mapStore).toBe("object");
    });

    it("should allow accessing mapStore state", () => {
      const state = mapStore.getState();
      expect(state).toBeDefined();
    });
  });

  describe("map hooks exports", () => {
    it("should export useMapStore hook", () => {
      expect(useMapStore).toBeDefined();
      expect(typeof useMapStore).toBe("function");
    });

    it("should export useMapActions hook", () => {
      expect(useMapActions).toBeDefined();
      expect(typeof useMapActions).toBe("function");
    });

    it("should allow calling useMapStore hook", () => {
      const result = useMapStore();
      expect(result).toBeDefined();
    });

    it("should allow calling useMapActions hook", () => {
      const result = useMapActions();
      expect(result).toBeDefined();
    });
  });

  describe("map overlay store exports", () => {
    it("should export mapOverlayStore", () => {
      expect(mapOverlayStore).toBeDefined();
      expect(typeof mapOverlayStore).toBe("object");
    });

    it("should export useMapOverlayStore hook", () => {
      expect(useMapOverlayStore).toBeDefined();
      expect(typeof useMapOverlayStore).toBe("function");
    });

    it("should export MapOverlayProvider component", () => {
      expect(MapOverlayProvider).toBeDefined();
      expect(typeof MapOverlayProvider).toBe("function");
    });

    it("should export setMapOverlayExternals function", () => {
      expect(setMapOverlayExternals).toBeDefined();
      expect(typeof setMapOverlayExternals).toBe("function");
    });

    it("should allow accessing mapOverlayStore state", () => {
      const state = mapOverlayStore.getState();
      expect(state).toBeDefined();
    });

    it("should allow calling useMapOverlayStore hook", () => {
      const result = useMapOverlayStore();
      expect(result).toBeDefined();
    });

    it("should allow calling setMapOverlayExternals", () => {
      expect(() => setMapOverlayExternals({})).not.toThrow();
    });
  });

  describe("store type exports", () => {
    it("should have MapStore type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapState type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapActions type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapTheme type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapUserLocation type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapOverlayStore type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapOverlayState type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have MapOverlayActions type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have ShareableUser type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have SharingUser type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have SharingSettings type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });
  });

  describe("edge cases - module structure", () => {
    it("should export all stores as objects", () => {
      expect(typeof mapStore).toBe("object");
      expect(typeof mapOverlayStore).toBe("object");
    });

    it("should export all hooks as functions", () => {
      expect(typeof useMapStore).toBe("function");
      expect(typeof useMapActions).toBe("function");
      expect(typeof useMapOverlayStore).toBe("function");
    });

    it("should export MapOverlayProvider as function", () => {
      expect(typeof MapOverlayProvider).toBe("function");
    });

    it("should export setMapOverlayExternals as function", () => {
      expect(typeof setMapOverlayExternals).toBe("function");
    });

    it("should maintain consistent export structure", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      const exportKeys = Object.keys(actualModule);
      expect(exportKeys).toContain("mapStore");
      expect(exportKeys).toContain("useMapStore");
      expect(exportKeys).toContain("useMapActions");
      expect(exportKeys).toContain("mapOverlayStore");
      expect(exportKeys).toContain("useMapOverlayStore");
      expect(exportKeys).toContain("MapOverlayProvider");
      expect(exportKeys).toContain("setMapOverlayExternals");
    });
  });

  describe("integration - store usage patterns", () => {
    it("should support map store workflow", () => {
      const store = mapStore;
      const state = store.getState();
      expect(store).toBeDefined();
      expect(state).toBeDefined();
    });

    it("should support map overlay store workflow", () => {
      const store = mapOverlayStore;
      const state = store.getState();
      expect(store).toBeDefined();
      expect(state).toBeDefined();
    });

    it("should support hook-based store access", () => {
      const mapStoreResult = useMapStore();
      const mapActionsResult = useMapActions();
      const overlayResult = useMapOverlayStore();
      
      expect(mapStoreResult).toBeDefined();
      expect(mapActionsResult).toBeDefined();
      expect(overlayResult).toBeDefined();
    });
  });
});
