import { processQueue } from "../queueProcessor";
import { addToQueue, clearQueue, getQueue } from "../storage";
import { useOfflineQueueStore } from "~/stores/offlineQueueStore";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

describe("offline integration", () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({
      pendingCount: 0,
      failedMutations: [],
      syncStatus: "idle",
      isProcessing: false,
    });
  });

  it("should handle offline-to-online transition", async () => {
    // Simulate offline mutation
    await addToQueue({
      id: "offline-mutation",
      mutationKey: "test.mutation",
      variables: { test: true },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    useOfflineQueueStore.getState().incrementPending();
    expect(useOfflineQueueStore.getState().pendingCount).toBe(1);

    // Simulate coming online and processing
    let executed = false;
    await processQueue(async () => {
      executed = true;
      return { success: true };
    });

    expect(executed).toBe(true);
    expect(useOfflineQueueStore.getState().pendingCount).toBe(0);

    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should handle queue overflow", async () => {
    // Add 101 mutations
    for (let i = 0; i < 101; i++) {
      await addToQueue({
        id: `overflow-${i}`,
        mutationKey: "test.mutation",
        variables: { index: i },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
      });
    }

    const queue = await getQueue();
    expect(queue.length).toBe(100);
    expect(queue[0].id).toBe("overflow-1"); // Oldest discarded
  });

  it("should handle validation error during sync", async () => {
    await addToQueue({
      id: "validation-error",
      mutationKey: "test.mutation",
      variables: { invalid: true },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await processQueue(async () => {
      const error = new Error("Validation failed");
      (error as { status?: number }).status = 400;
      throw error;
    });

    const queue = await getQueue();
    const mutation = queue.find((m) => m.id === "validation-error");
    // Validation errors should be removed from queue
    expect(mutation).toBeUndefined();
  });

  it("should handle server error with retry", async () => {
    await addToQueue({
      id: "server-error",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    let attempts = 0;
    await processQueue(async () => {
      attempts++;
      const error = new Error("Server error");
      (error as { status?: number }).status = 500;
      throw error;
    });

    expect(attempts).toBeGreaterThanOrEqual(3);

    const queue = await getQueue();
    const mutation = queue.find((m) => m.id === "server-error");
    expect(mutation?.status).toBe("failed");
    expect(mutation?.retryCount).toBeGreaterThanOrEqual(3);
  });

  it("should process queue in FIFO order", async () => {
    const order: string[] = [];

    for (let i = 1; i <= 3; i++) {
      await addToQueue({
        id: `fifo-${i}`,
        mutationKey: "test.mutation",
        variables: {},
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
      });
    }

    await processQueue(async (mutation: { id: string }) => {
      order.push(mutation.id);
      return { success: true };
    });

    expect(order).toEqual(["fifo-1", "fifo-2", "fifo-3"]);
  });
});
