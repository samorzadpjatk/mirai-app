import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getQueue,
  addToQueue,
  updateMutation,
  removeFromQueue,
  clearQueue,
  QUEUE_STORAGE_KEY,
  MAX_QUEUE_SIZE,
} from "../storage";

describe("offline storage", () => {
  beforeEach(() => {
    void AsyncStorage.clear();
  });

  it("should return empty queue when no data", async () => {
    const queue = await getQueue();
    expect(queue).toEqual([]);
  });

  it("should add mutation to queue", async () => {
    const mutation = await addToQueue({
      id: "test-1",
      mutationKey: "test.mutation",
      variables: { foo: "bar" },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    expect(mutation.id).toBe("test-1");
    expect(mutation.mutationKey).toBe("test.mutation");
    expect(mutation.schemaVersion).toBe("1.0.0");
  });

  it("should enforce MAX_QUEUE_SIZE and discard oldest", async () => {
    // Fill queue to max
    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      await addToQueue({
        id: `test-${i}`,
        mutationKey: "test.mutation",
        variables: { index: i },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
      });
    }

    // Add one more
    await addToQueue({
      id: "test-overflow",
      mutationKey: "test.mutation",
      variables: { overflow: true },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    const queue = await getQueue();
    expect(queue.length).toBe(MAX_QUEUE_SIZE);
    expect(queue[0].id).toBe("test-1"); // Oldest discarded
    expect(queue[MAX_QUEUE_SIZE - 1].id).toBe("test-overflow");
  });

  it("should update mutation", async () => {
    await addToQueue({
      id: "test-update",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    const updated = await updateMutation("test-update", {
      status: "failed",
      retryCount: 3,
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("failed");
    expect(updated?.retryCount).toBe(3);
  });

  it("should return null when updating non-existent mutation", async () => {
    const result = await updateMutation("non-existent", { status: "failed" });
    expect(result).toBeNull();
  });

  it("should remove mutation from queue", async () => {
    await addToQueue({
      id: "test-remove",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    const removed = await removeFromQueue("test-remove");
    expect(removed).toBe(true);

    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should return false when removing non-existent mutation", async () => {
    const removed = await removeFromQueue("non-existent");
    expect(removed).toBe(false);
  });

  it("should clear entire queue", async () => {
    await addToQueue({
      id: "test-clear",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await clearQueue();
    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should filter out invalid schema versions", async () => {
    const invalidEntry = {
      id: "test-invalid",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
      schemaVersion: "0.0.0", // Old version
    };

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([invalidEntry]));
    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });
});
