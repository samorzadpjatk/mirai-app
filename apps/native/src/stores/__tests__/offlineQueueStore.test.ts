import { useOfflineQueueStore } from "../offlineQueueStore";

describe("offlineQueueStore", () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({
      pendingCount: 0,
      failedMutations: [],
      syncStatus: "idle",
      isProcessing: false,
    });
  });

  it("should increment pending count", () => {
    useOfflineQueueStore.getState().incrementPending();
    expect(useOfflineQueueStore.getState().pendingCount).toBe(1);
  });

  it("should decrement pending count", () => {
    useOfflineQueueStore.setState({ pendingCount: 5 });
    useOfflineQueueStore.getState().decrementPending();
    expect(useOfflineQueueStore.getState().pendingCount).toBe(4);
  });

  it("should not decrement below 0", () => {
    useOfflineQueueStore.getState().decrementPending();
    expect(useOfflineQueueStore.getState().pendingCount).toBe(0);
  });

  it("should mark mutation as failed", () => {
    useOfflineQueueStore.getState().markFailed({
      id: "test-1",
      mutationKey: "test.mutation",
      error: "Network error",
      timestamp: Date.now(),
    });

    expect(useOfflineQueueStore.getState().failedMutations.length).toBe(1);
    expect(useOfflineQueueStore.getState().syncStatus).toBe("error");
  });

  it("should mark mutation as synced", () => {
    useOfflineQueueStore.getState().markFailed({
      id: "test-1",
      mutationKey: "test.mutation",
      error: "Network error",
      timestamp: Date.now(),
    });

    useOfflineQueueStore.getState().markSynced("test-1");
    expect(useOfflineQueueStore.getState().failedMutations.length).toBe(0);
    expect(useOfflineQueueStore.getState().syncStatus).toBe("idle");
  });

  it("should set processing state", () => {
    useOfflineQueueStore.getState().setProcessing(true);
    expect(useOfflineQueueStore.getState().isProcessing).toBe(true);
  });

  it("should clear failed mutations", () => {
    useOfflineQueueStore.getState().markFailed({
      id: "test-1",
      mutationKey: "test.mutation",
      error: "Network error",
      timestamp: Date.now(),
    });

    useOfflineQueueStore.getState().clearFailed();
    expect(useOfflineQueueStore.getState().failedMutations.length).toBe(0);
    expect(useOfflineQueueStore.getState().syncStatus).toBe("idle");
  });
});
