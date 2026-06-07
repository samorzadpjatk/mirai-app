import { processQueue, getIsProcessing, resetProcessingState } from "../queueProcessor";
import { getQueue, addToQueue, clearQueue } from "../storage";
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

describe("queueProcessor", () => {
  beforeEach(() => {
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

    await processQueue(executeMutation);
    expect(attempts).toBe(3);
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

    await processQueue(executeMutation);

    const queue = await getQueue();
    const failed = queue.find((m) => m.id === "fail-test");
    expect(failed?.status).toBe("failed");
    expect(failed?.retryCount).toBeGreaterThanOrEqual(3);
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
