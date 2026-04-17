import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IAuthPort } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Supabase Auth Gateway
 *
 * Implements IAuthPort using Supabase Auth client for authentication operations.
 */
export class SupabaseAuthGateway implements IAuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  signInWithPassword(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (!data.user || !data.session) {
          throw new Error("Sign in failed: no user or session returned");
        }
        return {
          user: { id: data.user.id, email: data.user.email ?? "" },
          session: { accessToken: data.session.access_token },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signInWithPassword",
          cause: error,
        }),
    });
  }

  signInWithOtp(
    email: string,
    otp: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.verifyOtp({
          email,
          token: otp,
          type: "email",
        });
        if (error) throw error;
        if (!data.user || !data.session) {
          throw new Error(
            "OTP verification failed: no user or session returned",
          );
        }
        return {
          user: { id: data.user.id, email: data.user.email ?? "" },
          session: { accessToken: data.session.access_token },
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signInWithOtp",
          cause: error,
        }),
    });
  }

  signUp(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string } | null },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        return {
          user: data.user
            ? { id: data.user.id, email: data.user.email ?? "" }
            : null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signUp",
          cause: error,
        }),
    });
  }

  signOut(): Effect.Effect<void, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.signOut",
          cause: error,
        }),
    });
  }

  getSession(): Effect.Effect<
    { user: { id: string; email: string } | null; accessToken: string | null },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.getSession();
        if (error) throw error;
        return {
          user: data.session?.user
            ? { id: data.session.user.id, email: data.session.user.email ?? "" }
            : null,
          accessToken: data.session?.access_token ?? null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.getSession",
          cause: error,
        }),
    });
  }

  refreshSession(): Effect.Effect<
    { session: { accessToken: string } | null },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.auth.refreshSession();
        if (error) throw error;
        return {
          session: data.session
            ? { accessToken: data.session.access_token }
            : null,
        };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseAuthGateway.refreshSession",
          cause: error,
        }),
    });
  }
}
