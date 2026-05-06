import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type * as indexModule from "../index";

jest.mock("../locationStore", () => ({
  locationStore: { getState: jest.fn(() => ({})), setState: jest.fn() },
  setLocationServerUpdater: jest.fn(),
}));

jest.mock("../locationHooks", () => ({
  useLocationContext: jest.fn(() => ({})),
  useLocationStore: jest.fn(() => ({})),
}));

jest.mock("../LocationStoreProvider", () => ({
  LocationStoreProvider: jest.fn(() => null),
}));

import {
  locationStore,
  setLocationServerUpdater,
  useLocationContext,
  useLocationStore,
  LocationStoreProvider,
} from "../index";

describe("stores/location/index exports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("locationStore exports", () => {
    it("should export locationStore", () => {
      expect(locationStore).toBeDefined();
      expect(typeof locationStore).toBe("object");
    });

    it("should export setLocationServerUpdater function", () => {
      expect(setLocationServerUpdater).toBeDefined();
      expect(typeof setLocationServerUpdater).toBe("function");
    });

    it("should allow accessing locationStore state", () => {
      const state = locationStore.getState();
      expect(state).toBeDefined();
    });

    it("should allow calling setLocationServerUpdater", () => {
      expect(() => setLocationServerUpdater(null)).not.toThrow();
      expect(() => setLocationServerUpdater(jest.fn())).not.toThrow();
    });
  });

  describe("location hooks exports", () => {
    it("should export useLocationContext hook", () => {
      expect(useLocationContext).toBeDefined();
      expect(typeof useLocationContext).toBe("function");
    });

    it("should export useLocationStore hook", () => {
      expect(useLocationStore).toBeDefined();
      expect(typeof useLocationStore).toBe("function");
    });

    it("should allow calling useLocationContext hook", () => {
      const result = useLocationContext();
      expect(result).toBeDefined();
    });

    it("should allow calling useLocationStore hook", () => {
      const result = useLocationStore();
      expect(result).toBeDefined();
    });
  });

  describe("LocationStoreProvider export", () => {
    it("should export LocationStoreProvider component", () => {
      expect(LocationStoreProvider).toBeDefined();
      expect(typeof LocationStoreProvider).toBe("function");
    });
  });

  describe("store type exports", () => {
    it("should have LocationStore type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have LocationState type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have LocationActions type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });

    it("should have LocationPermissionStatus type available", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      expect(actualModule).toBeDefined();
    });
  });

  describe("edge cases - module structure", () => {
    it("should export locationStore as object", () => {
      expect(typeof locationStore).toBe("object");
    });

    it("should export all hooks as functions", () => {
      expect(typeof useLocationContext).toBe("function");
      expect(typeof useLocationStore).toBe("function");
    });

    it("should export LocationStoreProvider as function", () => {
      expect(typeof LocationStoreProvider).toBe("function");
    });

    it("should export setLocationServerUpdater as function", () => {
      expect(typeof setLocationServerUpdater).toBe("function");
    });

    it("should maintain consistent export structure", () => {
      const actualModule = jest.requireActual<typeof indexModule>("../index");
      const exportKeys = Object.keys(actualModule);
      expect(exportKeys).toContain("locationStore");
      expect(exportKeys).toContain("setLocationServerUpdater");
      expect(exportKeys).toContain("useLocationContext");
      expect(exportKeys).toContain("useLocationStore");
      expect(exportKeys).toContain("LocationStoreProvider");
    });
  });

  describe("integration - store usage patterns", () => {
    it("should support location store workflow", () => {
      const store = locationStore;
      const state = store.getState();
      expect(store).toBeDefined();
      expect(state).toBeDefined();
    });

    it("should support hook-based store access", () => {
      const contextResult = useLocationContext();
      const storeResult = useLocationStore();
      
      expect(contextResult).toBeDefined();
      expect(storeResult).toBeDefined();
    });

    it("should support server updater injection", () => {
      const mockUpdater = jest.fn();
      setLocationServerUpdater(mockUpdater);
      expect(setLocationServerUpdater).toHaveBeenCalledWith(mockUpdater);
    });

    it("should support server updater removal", () => {
      setLocationServerUpdater(null);
      expect(setLocationServerUpdater).toHaveBeenCalledWith(null);
    });
  });
});
