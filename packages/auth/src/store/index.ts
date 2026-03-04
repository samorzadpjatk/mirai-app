// Auth store moved to @integral-2025-app/shared
export { authStore } from "@integral-2025-app/shared";
export type { AuthStore, AuthActions, AuthState, AuthUser } from "@integral-2025-app/shared";

export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useAuthStore,
} from "./authHooks";
