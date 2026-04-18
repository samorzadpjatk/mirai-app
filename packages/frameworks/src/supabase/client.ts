/**
 * Supabase Client - Framework Layer
 *
 * Client factory for creating Supabase client instances.
 * Provides both standard and server-side client creation.
 */

import { createClient } from "@supabase/supabase-js";
import type {
  RealSupabaseClient,
  SupabaseClientOptions,
} from "./types";

/**
 * Creates a Supabase client for browser/client-side usage
 *
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @param options - Additional client options
 * @returns SupabaseClient instance
 *
 * @example
 * ```typescript
 * const supabase = createSupabaseClient(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_ANON_KEY
 * );
 * ```
 */
export const createSupabaseClient = (
  url: string,
  anonKey: string,
  options?: SupabaseClientOptions,
): RealSupabaseClient => {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
    global: {
      headers: options?.global?.headers,
    },
  });
};

/**
 * Creates a Supabase client for server-side usage with service role
 *
 * @param url - Supabase project URL
 * @param serviceRoleKey - Supabase service role key
 * @param options - Additional client options
 * @returns SupabaseClient instance with service role permissions
 *
 * @example
 * ```typescript
 * const supabase = createServiceClient(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_SERVICE_ROLE_KEY
 * );
 * ```
 */
export const createServiceClient = (
  url: string,
  serviceRoleKey: string,
  options?: SupabaseClientOptions,
): RealSupabaseClient => {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      ...options?.auth,
    },
    global: {
      headers: {
        ...options?.global?.headers,
      },
    },
  });
};

/**
 * Creates a Supabase client with custom auth context
 *
 * Use this for server-side operations that need to act
 * on behalf of a specific user.
 *
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @param accessToken - User's access token for impersonation
 * @returns SupabaseClient instance with user context
 *
 * @example
 * ```typescript
 * const supabase = createClientWithAuth(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_ANON_KEY,
 *   userAccessToken
 * );
 * ```
 */
export const createClientWithAuth = (
  url: string,
  anonKey: string,
  accessToken: string,
): RealSupabaseClient => {
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};
