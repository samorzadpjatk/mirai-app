import { processQueue, getIsProcessing, resetProcessingState } from "../queueProcessor";
import { getQueue, addToQueue, clearQueue } from "../storage";
import { useOfflineQueueStore } from "~/stores/offlineQueueStore";

const mockStorage = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage.get(key) ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      mockStorage.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      mockStorage.clear();
      return Promise.resolve();
    }),
  },
}));

describe("queueProcessor", () => {
  beforeEach(() => {
    mockStorage.clear();
    resetProcessingState();
    useOfflineQueueStore.setState({
      pendingCount: 0,
      failedMutations: [],
      syncStatus: "idle",
      isProcessing: false,
    });
  });

  it("should process queue FIFO", async () => {
    const executedMutations: string[] = [];
    const executeMutation = async (mutation: { id: string }) => {
      executedMutations.push(mutation.id);
      return { success: true };
    };

    await addToQueue({
      id: "first",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await addToQueue({
      id: "second",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await processQueue(executeMutation);

    expect(executedMutations).toEqual(["first", "second"]);
    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should retry failed mutations with exponential backoff", async () => {
    let attempts = 0;
    const executeMutation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Server error");
      }
      return { success: true };
    };

    await addToQueue({
      id: "retry-test",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    // First attempt fails, retryCount becomes 1, backoff 1s
    await processQueue(executeMutation);
    expect(attempts).toBe(1);

    // Second attempt fails, retryCount becomes 2, backoff 2s
    await processQueue(executeMutation);
    expect(attempts).toBe(2);

    // Third attempt succeeds
    await processQueue(executeMutation);
    expect(attempts).toBe(3);

    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should mark mutation as failed after max retries", async () => {
    const executeMutation = async () => {
      throw new Error("Server error");
    };

    await addToQueue({
      id: "fail-test",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    // Attempt 1: retryCount becomes 1
    await processQueue(executeMutation);

    // Attempt 2: retryCount becomes 2
    await processQueue(executeMutation);

    // Attempt 3: retryCount becomes 3, marked as failed (max retries = 3)
    await processQueue(executeMutation);

    const queue = await getQueue();
    const failed = queue.find((m) => m.id === "fail-test");
    expect(failed?.status).toBe("failed");
    expect(failed?.retryCount).toBe(3);
  });

  it("should skip permanently failed mutations", async () => {
    const executedMutations: string[] = [];
    const executeMutation = async (mutation: { id: string }) => {
      executedMutations.push(mutation.id);
      return { success: true };
    };

    await addToQueue({
      id: "failed",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 3,
      status: "failed",
    });

    await addToQueue({
      id: "pending",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await processQueue(executeMutation);
    expect(executedMutations).toEqual(["pending"]);
  });

  it("should prevent concurrent processing", async () => {
    let processCount = 0;
    const executeMutation = async () => {
      processCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { success: true };
    };

    await addToQueue({
      id: "concurrent",
      mutationKey: "test",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    // Start two processors simultaneously
    await Promise.all([processQueue(executeMutation), processQueue(executeMutation)]);

    expect(processCount).toBe(1);
  });
});
