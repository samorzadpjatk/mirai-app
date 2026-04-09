import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export type ReviewStatus = "APPROVED" | "REJECTED";

export interface Submission {
  id: string;
  status: string;
  imageIds: string[];
  videoId: string | null;
  textContent: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | Date;
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
  };
}

export interface JudgementState {
  tripId: string;
  challengeId: string;
  dismissedIds: string[];
}

export interface JudgementActions {
  setTripId: (tripId: string) => void;
  setChallengeId: (challengeId: string) => void;
  addDismissedId: (id: string) => void;
  removeDismissedId: (id: string) => void;
  resetDismissedIds: () => void;
}

export type JudgementStore = JudgementState & JudgementActions;

export const judgementStore = createStore<JudgementStore>()((set, get) => ({
  tripId: "",
  challengeId: "",
  dismissedIds: [],

  setTripId: (tripId) => set({ tripId }),
  setChallengeId: (challengeId) => set({ challengeId }),
  addDismissedId: (id) => {
    const current = get().dismissedIds;
    if (!current.includes(id)) {
      set({ dismissedIds: [...current, id] });
    }
  },
  removeDismissedId: (id) => {
    const current = get().dismissedIds;
    set({ dismissedIds: current.filter((dismissedId) => dismissedId !== id) });
  },
  resetDismissedIds: () => set({ dismissedIds: [] }),
}));

// Hooks for accessing judgement store
export function useJudgementStore<T>(
  selector: (state: JudgementStore) => T,
): T {
  return useStore(judgementStore, selector);
}
