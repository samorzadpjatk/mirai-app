// Auth store moved to @mirai-app/shared
export { authStore } from "@mirai-app/shared";
export type { AuthStore, AuthActions, AuthState, AuthUser } from "@mirai-app/shared";

export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useAuthStore,
} from "./authHooks";
