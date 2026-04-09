// Auth client exports - infrastructure configuration for authentication
export type {
  DatabaseUser,
  Role,
  AuthState,
  SignInWithOtpOptions,
  SignInWithPasswordOptions,
  AuthContextValue,
} from "./types";

// Re-export from local stores for convenience
export type { AuthUser } from "../stores/authStore";

// Client-side hooks and store
export * from "./client";

// Server-side auth functions (re-exported from adapters)
export * from "./server";
