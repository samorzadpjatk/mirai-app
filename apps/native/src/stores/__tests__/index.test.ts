import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  mapStore,
  judgementStore,
  useJudgementStore,
  locationStore,
  useJudgement,
  useLocationContext,
  useLocationStore,
  useMapStore,
  useMapActions,
} from "../index";

jest.mock("@mirai-app/shared", () => ({
  mapStore: { getState: jest.fn(() => ({})), setState: jest.fn((_partial: unknown) => {}) },
  judgementStore: { getState: jest.fn(() => ({})), setState: jest.fn((_partial: unknown) => {}) },
  useJudgementStore: jest.fn(() => ({})),
}));

jest.mock("../location", () => ({
  locationStore: { getState: jest.fn(() => ({})), setState: jest.fn((_partial: unknown) => {}) },
  useLocationContext: jest.fn(() => ({})),
  useLocationStore: jest.fn(() => ({})),
}));

jest.mock("../judgement", () => ({
  useJudgement: jest.fn(() => ({})),
}));

jest.mock("../map", () => ({
  useMapStore: jest.fn(() => ({})),
  useMapActions: jest.fn(() => ({})),
}));

describe("stores/index exports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("store exports from @mirai-app/shared", () => {
    it("should export mapStore", () => {
      expect(mapStore).toBeDefined();
      expect(typeof mapStore).toBe("object");
    });

    it("should export judgementStore", () => {
      expect(judgementStore).toBeDefined();
      expect(typeof judgementStore).toBe("object");
    });

    it("should export useJudgementStore hook", () => {
      expect(useJudgementStore).toBeDefined();
      expect(typeof useJudgementStore).toBe("function");
    });
  });

  describe("location store exports", () => {
    it("should export locationStore", () => {
      expect(locationStore).toBeDefined();
      expect(typeof locationStore).toBe("object");
    });

    it("should export useLocationContext hook", () => {
      expect(useLocationContext).toBeDefined();
      expect(typeof useLocationContext).toBe("function");
    });

    it("should export useLocationStore hook", () => {
      expect(useLocationStore).toBeDefined();
      expect(typeof useLocationStore).toBe("function");
    });
  });

  describe("judgement exports", () => {
    it("should export useJudgement hook", () => {
      expect(useJudgement).toBeDefined();
      expect(typeof useJudgement).toBe("function");
    });
  });

  describe("map exports", () => {
    it("should export useMapStore hook", () => {
      expect(useMapStore).toBeDefined();
      expect(typeof useMapStore).toBe("function");
    });

    it("should export useMapActions hook", () => {
      expect(useMapActions).toBeDefined();
      expect(typeof useMapActions).toBe("function");
    });
  });

  describe("integration - store usage patterns", () => {
    it("should allow accessing mapStore state", () => {
      const state = mapStore.getState();
      expect(state).toBeDefined();
    });

    it("should allow accessing judgementStore state", () => {
      const state = judgementStore.getState();
      expect(state).toBeDefined();
    });

    it("should allow accessing locationStore state", () => {
      const state = locationStore.getState();
      expect(state).toBeDefined();
    });

    it("should allow calling useJudgementStore hook", () => {
      const result = useJudgementStore();
      expect(result).toBeDefined();
    });

    it("should allow calling useLocationStore hook", () => {
      const result = useLocationStore();
      expect(result).toBeDefined();
    });

    it("should allow calling useMapStore hook", () => {
      const result = useMapStore();
      expect(result).toBeDefined();
    });

    it("should allow calling useMapActions hook", () => {
      const result = useMapActions();
      expect(result).toBeDefined();
    });

    it("should allow calling useLocationContext hook", () => {
      const result = useLocationContext();
      expect(result).toBeDefined();
    });

    it("should allow calling useJudgement hook", () => {
      const result = useJudgement();
      expect(result).toBeDefined();
    });
  });

  describe("edge cases - module structure", () => {
    it("should export all stores as objects", () => {
      expect(typeof mapStore).toBe("object");
      expect(typeof judgementStore).toBe("object");
      expect(typeof locationStore).toBe("object");
    });

    it("should export all hooks as functions", () => {
      expect(typeof useJudgementStore).toBe("function");
      expect(typeof useLocationStore).toBe("function");
      expect(typeof useLocationContext).toBe("function");
      expect(typeof useMapStore).toBe("function");
      expect(typeof useMapActions).toBe("function");
      expect(typeof useJudgement).toBe("function");
    });

    it("should maintain consistent export structure", () => {
      // Use require instead of dynamic import for CommonJS compatibility
      const indexModule: Record<string, unknown> = require("../index");
      const exportKeys = Object.keys(indexModule);
      expect(exportKeys).toContain("mapStore");
      expect(exportKeys).toContain("judgementStore");
      expect(exportKeys).toContain("useJudgementStore");
      expect(exportKeys).toContain("locationStore");
      expect(exportKeys).toContain("useJudgement");
      expect(exportKeys).toContain("useLocationContext");
      expect(exportKeys).toContain("useLocationStore");
      expect(exportKeys).toContain("useMapStore");
      expect(exportKeys).toContain("useMapActions");
    });
  });
});
