// Zustand stores moved from apps/native and packages/auth

// Map store
export { mapStore } from "./mapStore";
export type { MapStore, MapState, MapActions, MapTheme, MapUserLocation } from "./mapStore";

// Judgement store
export { judgementStore, useJudgementStore } from "./judgementStore";
export type {
  JudgementState,
  JudgementActions,
  JudgementStore,
  ReviewStatus,
  Submission,
} from "./judgementStore";

// Auth store
export { authStore, _resetAuthStoreForTests } from "./authStore";
export type {
  AuthStore,
  AuthState,
  AuthActions,
  AuthUser,
  SupabaseClient,
  SupabaseSession,
} from "./authStore";

// Root navigation gate (pure, UI-framework agnostic)
export { hasActiveSession, resolveRootGate } from "./authGate";
export type { RootGate, RootGateInput } from "./authGate";
