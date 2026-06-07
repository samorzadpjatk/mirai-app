import AsyncStorage from "@react-native-async-storage/async-storage";

export const QUEUE_STORAGE_KEY = "mirai-offline-mutation-queue";
export const MAX_QUEUE_SIZE = 100;
export const SCHEMA_VERSION = "1.0.0";

export interface QueuedMutation {
  id: string;
  mutationKey: string;
  variables: unknown;
  timestamp: number;
  retryCount: number;
  status: "pending" | "retrying" | "failed";
  error?: string;
  schemaVersion: string;
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!data) return [];

    const queue: QueuedMutation[] = JSON.parse(data);

    // Validate schema version
    const validQueue = queue.filter((item) => item.schemaVersion === SCHEMA_VERSION);

    if (validQueue.length !== queue.length) {
      // Schema mismatch detected, clear invalid entries
      await saveQueue(validQueue);
    }

    return validQueue;
  } catch (error) {
    console.error("Failed to load queue from storage:", error);
    return [];
  }
}

export async function addToQueue(
  mutation: Omit<QueuedMutation, "schemaVersion">,
): Promise<QueuedMutation> {
  const queue = await getQueue();

  const newMutation: QueuedMutation = {
    id: mutation.id,
    mutationKey: mutation.mutationKey,
    variables: mutation.variables,
    timestamp: mutation.timestamp,
    retryCount: mutation.retryCount,
    status: mutation.status,
    error: mutation.error,
    schemaVersion: SCHEMA_VERSION,
  };

  // If queue is full, remove oldest entries
  if (queue.length >= MAX_QUEUE_SIZE) {
    const overflow = queue.length - MAX_QUEUE_SIZE + 1;
    queue.splice(0, overflow);
  }

  queue.push(newMutation);
  await saveQueue(queue);

  return newMutation;
}

export async function updateMutation(
  id: string,
  updates: Partial<QueuedMutation>,
): Promise<QueuedMutation | null> {
  const queue = await getQueue();
  const index = queue.findIndex((item) => item.id === id);

  if (index === -1) return null;

  const updated = { ...queue[index], ...updates } as QueuedMutation;
  queue[index] = updated;
  await saveQueue(queue);

  return updated;
}

export async function removeFromQueue(id: string): Promise<boolean> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);

  if (filtered.length === queue.length) return false;

  await saveQueue(filtered);
  return true;
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
}

async function saveQueue(queue: QueuedMutation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save queue to storage:", error);
    throw new Error("Failed to save queue to storage");
  }
}
