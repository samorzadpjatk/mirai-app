import type { SupabaseSession } from "@integral-2025-app/supabase";

export interface AuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  /**
   * Convenience display name derived from first/last, kept for backward compatibility.
   */
  name: string | null;
  emailVerified: Date | null;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
}

export interface AuthState {
  user: AuthUser | null;
  session: SupabaseSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignInWithOtpOptions {
  email: string;
}

export interface SignUpWithOtpOptions {
  email: string;
  metadata?: Record<string, unknown>;
}

export interface AuthContextValue extends AuthState {
  signInWithOtp: (options: SignInWithOtpOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
