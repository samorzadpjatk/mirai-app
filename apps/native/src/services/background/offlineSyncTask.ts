import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { processQueue } from "~/services/offline/queueProcessor";
import { getQueue } from "~/services/offline/storage";

const OFFLINE_SYNC_TASK = "mirai-offline-sync-task";

TaskManager.defineTask(OFFLINE_SYNC_TASK, async () => {
  try {
    const queue = await getQueue();

    if (queue.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Note: The actual mutation execution requires access to the oRPC client
    // which is not available in background tasks. This task serves as a
    // trigger to wake the app, which will then process the queue on foreground.

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerOfflineSyncTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(OFFLINE_SYNC_TASK);

  if (isRegistered) {
    return;
  }

  await BackgroundFetch.registerTaskAsync(OFFLINE_SYNC_TASK, {
    minimumInterval: 60 * 60, // 1 hour
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterOfflineSyncTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(OFFLINE_SYNC_TASK);

  if (!isRegistered) {
    return;
  }

  await BackgroundFetch.unregisterTaskAsync(OFFLINE_SYNC_TASK);
}
