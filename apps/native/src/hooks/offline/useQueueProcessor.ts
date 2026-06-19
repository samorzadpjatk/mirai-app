import { useEffect } from "react";
import { processQueue } from "~/services/offline/queueProcessor";
import { getMutationExecutor } from "~/services/offline/executorRegistry";
import { getQueue } from "~/services/offline/storage";
import { useNetworkStatus } from "./useNetworkStatus";

/**
 * Hook that watches network status and triggers offline mutation queue processing
 * when the app comes back online. Uses the executor registry to look up the actual
 * mutation function for each queued mutation.
 */
export function useQueueProcessor(): void {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  useEffect(() => {
    if (!isConnected || !isInternetReachable) return;

    void (async () => {
      const queue = await getQueue();
      if (queue.length === 0) return;

      await processQueue(async (mutation) => {
        const executor = getMutationExecutor(mutation.mutationKey);
        if (!executor) {
          throw new Error(`No executor registered for mutation key: ${mutation.mutationKey}`);
        }
        return executor(mutation.variables);
      });
    })();
  }, [isConnected, isInternetReachable]);
}
