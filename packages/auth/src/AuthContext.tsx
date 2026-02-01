"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { createSupabaseClient } from "@integral-2025-app/supabase";
import type {
  SupabaseClient,
  SupabaseSession,
} from "@integral-2025-app/supabase";
import type {
  AuthContextValue,
  AuthUser,
  SignInWithOtpOptions,
  SignUpWithOtpOptions,
} from "./types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export interface AuthProviderProps {
  children: ReactNode;
  supabaseUrl: string;
  supabaseKey: string;
  supabaseClient?: SupabaseClient;
  storageOptions?: {
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  };
  onUserFetch?: (authUserId: string) => Promise<AuthUser | null>;
}

export function AuthProvider({
  children,
  supabaseUrl,
  supabaseKey,
  supabaseClient,
  onUserFetch,
  storageOptions,
}: AuthProviderProps) {
  const [client] = useState<SupabaseClient>(
    () =>
      supabaseClient ??
      createSupabaseClient(supabaseUrl, supabaseKey, storageOptions?.storage),
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user && onUserFetch) {
        onUserFetch(session.user.id)
          .then(setUser)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session?.user && onUserFetch) {
        setIsLoading(true);
        onUserFetch(session.user.id)
          .then(setUser)
          .catch(console.error)
          .finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, onUserFetch]);

  const signInWithOtp = async ({ email }: SignInWithOtpOptions) => {
    const { error } = await client.auth.signInWithOtp({
      email,
    });

    if (error) {
      throw error;
    }
  };

  const signUpWithOtp = async ({ email, metadata }: SignUpWithOtpOptions) => {
    // Use standard signUp to create a pending user and trigger email verification/OTP

    const { data, error } = await client.auth.signInWithOtp({
      email,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw error;
    }
  };

  const verifyOtp = async ({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) => {
    const { error } = await client.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      throw error;
    }
    // Refresh session & fetch user after successful verification
    const { data: sessionData } = await client.auth.getSession();
    setSession(sessionData.session);

    if (sessionData.session?.user && onUserFetch) {
      setIsLoading(true);
      try {
        const fetchedUser = await onUserFetch(sessionData.session.user.id);
        setUser(fetchedUser);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
  };

  const refreshSession = async () => {
    const { data, error } = await client.auth.refreshSession();

    if (error) {
      throw error;
    }

    setSession(data.session);
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    signInWithOtp,
    signUpWithOtp,
    verifyOtp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
