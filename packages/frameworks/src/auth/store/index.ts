// Auth store - now in frameworks/src/stores
export { authStore } from "../../stores/authStore";
export type {
  AuthStore,
  AuthActions,
  AuthState,
  AuthUser,
} from "../../stores/authStore";

export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useAuthStore,
} from "./authHooks";
