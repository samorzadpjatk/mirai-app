import type { SupabaseSession } from "@integral-2025-app/supabase";

export interface DatabaseUser {
  id: string;
  authUserId: string | null;
  email: string | null;
  name: string | null;
  hasAvatar: boolean;
  wristNumber: string | null;
  houseNumber: string | null;
  role: Role;
  groupId: string | null;
  emailVerified: Date | null;
}

export type Role = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";

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

export interface SignInWithPasswordOptions {
  email: string;
  password: string;
}

export interface SignUpWithOtpOptions {
  email: string;
  metadata?: Record<string, unknown>;
}

export interface AuthContextValue extends AuthState {
  signInWithOtp: (options: SignInWithOtpOptions) => Promise<void>;
  signInWithPassword: (options: SignInWithPasswordOptions) => Promise<void>;
  // Send a code to create an account (signup via OTP)
  signUpWithOtp: (options: SignUpWithOtpOptions) => Promise<void>;
  // Verify a 6-digit OTP code sent to the user's email (for sign-in or signup)
  verifyOtp: (options: { email: string; token: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
