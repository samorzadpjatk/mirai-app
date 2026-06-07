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

describe("offline E2E flow", () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({
      pendingCount: 0,
      failedMutations: [],
      syncStatus: "idle",
      isProcessing: false,
    });
  });

  it("should complete full offline flow: view trip -> submit challenge -> come online -> verify sync", async () => {
    // Step 1: User is online, views trip data (cache populated)
    const tripData = {
      id: "trip-123",
      name: "Test Trip",
      groups: [{ id: "group-1", name: "Group A" }],
      challenges: [{ id: "challenge-1", name: "Photo Challenge" }],
    };

    // Step 2: User goes offline
    // (Simulated by not making network requests)

    // Step 3: User submits challenge while offline
    await addToQueue({
      id: "challenge-submission",
      mutationKey: "challengeSubmission.create",
      variables: {
        tripId: "trip-123",
        challengeId: "challenge-1",
        imageIds: ["photo-1.jpg"],
      },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    useOfflineQueueStore.getState().incrementPending();
    expect(useOfflineQueueStore.getState().pendingCount).toBe(1);

    // Step 4: User comes back online
    // (Simulated by processing queue)
    let synced = false;
    await processQueue(async (mutation) => {
      if (mutation.mutationKey === "challengeSubmission.create") {
        synced = true;
        return { id: "submission-123", status: "APPROVED" };
      }
      return { success: true };
    });

    // Step 5: Verify sync
    expect(synced).toBe(true);
    expect(useOfflineQueueStore.getState().pendingCount).toBe(0);

    const queue = await getQueue();
    expect(queue.length).toBe(0);
  });

  it("should handle profile update offline flow", async () => {
    // Step 1: User goes offline
    // Step 2: User updates profile
    await addToQueue({
      id: "profile-update",
      mutationKey: "user.updateMyProfile",
      variables: {
        firstName: "John",
        lastName: "Doe",
      },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    useOfflineQueueStore.getState().incrementPending();

    // Step 3: User comes back online
    let profileUpdated = false;
    await processQueue(async (mutation) => {
      if (mutation.mutationKey === "user.updateMyProfile") {
        profileUpdated = true;
        return { id: "user-123", firstName: "John", lastName: "Doe" };
      }
      return { success: true };
    });

    expect(profileUpdated).toBe(true);
    expect(useOfflineQueueStore.getState().pendingCount).toBe(0);
  });

  it("should handle queue overflow by discarding oldest", async () => {
    // Step 1: Fill queue with 100 entries
    for (let i = 0; i < 100; i++) {
      await addToQueue({
        id: `old-${i}`,
        mutationKey: "test.mutation",
        variables: { index: i },
        timestamp: Date.now(),
        retryCount: 0,
        status: "pending",
      });
    }

    // Step 2: Add one more entry
    await addToQueue({
      id: "new-entry",
      mutationKey: "test.mutation",
      variables: { new: true },
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    // Step 3: Verify oldest was discarded
    const queue = await getQueue();
    expect(queue.length).toBe(100);
    expect(queue[0].id).toBe("old-1");
    expect(queue[99].id).toBe("new-entry");
  });

  it("should handle multiple mutations with mixed results", async () => {
    // Add multiple mutations
    await addToQueue({
      id: "success-1",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await addToQueue({
      id: "fail-1",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    await addToQueue({
      id: "success-2",
      mutationKey: "test.mutation",
      variables: {},
      timestamp: Date.now(),
      retryCount: 0,
      status: "pending",
    });

    const results: { id: string; status: string }[] = [];
    await processQueue(async (mutation) => {
      if (mutation.id === "fail-1") {
        const error = new Error("Server error");
        (error as { status?: number }).status = 500;
        throw error;
      }
      results.push({ id: mutation.id, status: "success" });
      return { success: true };
    });

    expect(results.map((r) => r.id)).toEqual(["success-1", "success-2"]);

    const queue = await getQueue();
    const failed = queue.find((m) => m.id === "fail-1");
    expect(failed?.status).toBe("failed");
  });
});
