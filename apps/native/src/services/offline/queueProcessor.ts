import { useOfflineQueueStore } from "~/stores/offlineQueueStore";
import { getQueue, updateMutation, removeFromQueue, type QueuedMutation } from "./storage";
import { classifyError } from "./errorClassifier";

const MAX_RETRIES = 3;
const BACKOFF_DELAYS = [1000, 2000, 4000]; // Exponential backoff

let isProcessing = false;

export function getIsProcessing(): boolean {
  return isProcessing;
}

export async function processQueue(
  executeMutation: (mutation: QueuedMutation) => Promise<unknown>,
): Promise<void> {
  if (isProcessing) return;

  isProcessing = true;
  useOfflineQueueStore.getState().setProcessing(true);
  useOfflineQueueStore.getState().setSyncStatus("syncing");

  try {
    const queue = await getQueue();

    for (const mutation of queue) {
      if (mutation.status === "failed" && mutation.retryCount >= MAX_RETRIES) {
        continue; // Skip permanently failed mutations
      }

      try {
        await updateMutation(mutation.id, { status: "retrying" });

        await executeMutation(mutation);

        await removeFromQueue(mutation.id);
        useOfflineQueueStore.getState().decrementPending();
      } catch (error) {
        const classified = classifyError(error);
        const newRetryCount = mutation.retryCount + 1;

        if (!classified.shouldRetry || newRetryCount >= MAX_RETRIES) {
          // Mark as permanently failed
          await updateMutation(mutation.id, {
            status: "failed",
            retryCount: newRetryCount,
            error: classified.message,
          });

          useOfflineQueueStore.getState().markFailed({
            id: mutation.id,
            mutationKey: mutation.mutationKey,
            error: classified.message,
            timestamp: Date.now(),
          });
        } else {
          // Retry with backoff
          await updateMutation(mutation.id, {
            status: "pending",
            retryCount: newRetryCount,
          });

          // Wait before next retry
          const delay = BACKOFF_DELAYS[Math.min(newRetryCount - 1, BACKOFF_DELAYS.length - 1)];
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  } finally {
    isProcessing = false;
    useOfflineQueueStore.getState().setProcessing(false);

    const remainingQueue = await getQueue();
    if (remainingQueue.length === 0) {
      useOfflineQueueStore.getState().setSyncStatus("idle");
    } else if (remainingQueue.some((m) => m.status === "failed")) {
      useOfflineQueueStore.getState().setSyncStatus("error");
    }
  }
}

export function resetProcessingState(): void {
  isProcessing = false;
  useOfflineQueueStore.getState().setProcessing(false);
}
