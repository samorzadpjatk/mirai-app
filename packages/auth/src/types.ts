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

export interface AuthContextValue extends AuthState {
  signIn: (options: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface SignInOptions {
  provider: string;
  redirectTo?: string;
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
