import type { Session as SupabaseSession } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  authUserId: string;
  email: string | null;
  name: string | null;
  emailVerified: Date | null;
}

export interface AuthState {
  user: AuthUser | null;
  session: SupabaseSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignInWithEmailOptions {
  email: string;
  password: string;
}

export interface SignUpWithEmailOptions {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface SignInWithOAuthOptions {
  provider: string;
  redirectTo?: string;
}

export interface AuthContextValue extends AuthState {
  signInWithEmail: (options: SignInWithEmailOptions) => Promise<void>;
  signUpWithEmail: (options: SignUpWithEmailOptions) => Promise<void>;
  signInWithOAuth: (options: SignInWithOAuthOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface SupabaseClientOptions {
  auth?: {
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
}
