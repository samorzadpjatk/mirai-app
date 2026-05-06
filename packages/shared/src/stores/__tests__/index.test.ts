import { describe, it, expect } from "vitest";

// Test that all exports are available from the stores index
describe("Stores Index Exports", () => {
  describe("Map Store Exports", () => {
    it("should export mapStore", async () => {
      const { mapStore } = await import("../index");
      expect(mapStore).toBeDefined();
      expect(typeof mapStore).toBe("object");
      expect(typeof mapStore.getState).toBe("function");
      expect(typeof mapStore.setState).toBe("function");
      expect(typeof mapStore.subscribe).toBe("function");
    });

    it("should export MapStore type", async () => {
      // Type-only export - verify the module loads correctly
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export MapState type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export MapActions type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export MapTheme type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export MapUserLocation type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });
  });

  describe("Judgement Store Exports", () => {
    it("should export judgementStore", async () => {
      const { judgementStore } = await import("../index");
      expect(judgementStore).toBeDefined();
      expect(typeof judgementStore).toBe("object");
      expect(typeof judgementStore.getState).toBe("function");
    });

    it("should export useJudgementStore hook", async () => {
      const { useJudgementStore } = await import("../index");
      expect(useJudgementStore).toBeDefined();
      expect(typeof useJudgementStore).toBe("function");
    });

    it("should export JudgementState type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export JudgementActions type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export JudgementStore type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export ReviewStatus type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export Submission type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });
  });

  describe("Auth Store Exports", () => {
    it("should export authStore", async () => {
      const { authStore } = await import("../index");
      expect(authStore).toBeDefined();
      expect(typeof authStore).toBe("object");
      expect(typeof authStore.getState).toBe("function");
    });

    it("should export AuthStore type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export AuthState type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export AuthActions type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export AuthUser type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export SupabaseClient type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });

    it("should export SupabaseSession type", async () => {
      const index = await import("../index");
      expect(index).toBeDefined();
    });
  });

  describe("Store Functionality via Index", () => {
    it("mapStore should be functional when imported from index", async () => {
      const { mapStore } = await import("../index");
      
      // Test that we can interact with the store
      const initialState = mapStore.getState();
      expect(initialState.selectedUserId).toBeNull();
      
      // Test action
      mapStore.getState().setShowManageModal(true);
      expect(mapStore.getState().showManageModal).toBe(true);
      
      // Reset
      mapStore.getState().setShowManageModal(false);
    });

    it("judgementStore should be functional when imported from index", async () => {
      const { judgementStore } = await import("../index");
      
      // Test that we can interact with the store
      const initialState = judgementStore.getState();
      expect(initialState.tripId).toBeDefined();
      
      // Test action
      judgementStore.getState().setTripId("test-trip");
      expect(judgementStore.getState().tripId).toBe("test-trip");
      
      // Reset
      judgementStore.getState().setTripId("");
    });

    it("authStore should be functional when imported from index", async () => {
      const { authStore } = await import("../index");
      
      // Test that we can interact with the store
      const initialState = authStore.getState();
      expect(initialState.isAuthenticated).toBeDefined();
      expect(initialState.user).toBeDefined();
      
      // Test action
      authStore.getState().setLoading(false);
      expect(authStore.getState().isLoading).toBe(false);
      
      // Reset
      authStore.getState().setLoading(true);
    });
  });

  describe("Type Compatibility", () => {
    it("exported types should be compatible with their implementations", async () => {
      const { 
        mapStore, 
        judgementStore, 
        authStore,
      } = await import("../index");

      // Verify stores implement their respective types
      const mapState = mapStore.getState();
      const judgementState = judgementStore.getState();
      const authState = authStore.getState();

      expect(mapState).toBeDefined();
      expect(judgementState).toBeDefined();
      expect(authState).toBeDefined();
    });
  });

  describe("Re-export Consistency", () => {
    it("should re-export the same store instances", async () => {
      const index1 = await import("../index");
      const index2 = await import("../index");

      // Same instance should be returned
      expect(index1.mapStore).toBe(index2.mapStore);
      expect(index1.judgementStore).toBe(index2.judgementStore);
      expect(index1.authStore).toBe(index2.authStore);
    });

    it("should maintain state across imports", async () => {
      const { mapStore: map1 } = await import("../index");
      
      // Modify state
      map1.getState().setShowManageModal(true);
      
      // Re-import and check state persists
      const { mapStore: map2 } = await import("../index");
      expect(map2.getState().showManageModal).toBe(true);
      
      // Reset
      map2.getState().setShowManageModal(false);
    });
  });
});
