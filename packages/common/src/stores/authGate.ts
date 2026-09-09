import type { AuthState } from "./authStore";

/**
 * Minimal auth slice the root navigator needs in order to decide what to render on the
 * very first frame. Deliberately does NOT include `user`: resolving the backend user
 * profile costs a network round trip, and blocking the navigation tree on it is what
 * made cold starts show a blank screen.
 */
export type RootGateInput = Pick<AuthState, "session" | "isSessionLoading">;

/**
 * What the root navigator should render.
 *
 * - `loading` — the session read has not resolved yet; show the loading screen.
 * - `authenticated` — a usable access token exists; mount the protected routes.
 * - `unauthenticated` — no session; mount the public routes.
 */
export type RootGate = "loading" | "authenticated" | "unauthenticated";

/**
 * True when the store holds a session with a usable access token.
 */
export function hasActiveSession(state: Pick<AuthState, "session">): boolean {
  return Boolean(state.session?.access_token);
}

/**
 * Resolve which half of the root navigator to mount.
 *
 * The only thing worth blocking the first frame on is the session read, which is local
 * (Keychain/AsyncStorage) plus at worst a token refresh. The user profile is allowed to
 * arrive later — consumers that need it already tolerate `user === null`.
 */
export function resolveRootGate(state: RootGateInput): RootGate {
  if (state.isSessionLoading) {
    return "loading";
  }

  return hasActiveSession(state) ? "authenticated" : "unauthenticated";
}
