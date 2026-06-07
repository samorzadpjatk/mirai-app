import { create } from "zustand";

export type SyncStatus = "idle" | "syncing" | "error";

export interface FailedMutation {
  id: string;
  mutationKey: string;
  error: string;
  timestamp: number;
}

interface OfflineQueueState {
  pendingCount: number;
  failedMutations: FailedMutation[];
  syncStatus: SyncStatus;
  isProcessing: boolean;

  // Actions
  incrementPending: () => void;
  decrementPending: () => void;
  setPendingCount: (count: number) => void;
  markFailed: (mutation: FailedMutation) => void;
  markSynced: (id: string) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setProcessing: (isProcessing: boolean) => void;
  clearFailed: () => void;
  removeFailed: (id: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  pendingCount: 0,
  failedMutations: [],
  syncStatus: "idle",
  isProcessing: false,

  incrementPending: () => set((state) => ({ pendingCount: state.pendingCount + 1 })),

  decrementPending: () =>
    set((state) => ({
      pendingCount: Math.max(0, state.pendingCount - 1),
    })),

  setPendingCount: (count) => set({ pendingCount: Math.max(0, count) }),

  markFailed: (mutation) =>
    set((state) => ({
      failedMutations: [...state.failedMutations.filter((m) => m.id !== mutation.id), mutation],
      syncStatus: "error",
    })),

  markSynced: (id) =>
    set((state) => ({
      failedMutations: state.failedMutations.filter((m) => m.id !== id),
      syncStatus: state.failedMutations.length <= 1 ? "idle" : "error",
    })),

  setSyncStatus: (status) => set({ syncStatus: status }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  clearFailed: () => set({ failedMutations: [], syncStatus: "idle" }),

  removeFailed: (id) =>
    set((state) => ({
      failedMutations: state.failedMutations.filter((m) => m.id !== id),
      syncStatus: state.failedMutations.length <= 1 ? "idle" : "error",
    })),
}));
