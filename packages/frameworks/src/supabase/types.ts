/**
 * Supabase Types - Framework Layer
 *
 * Type definitions for Supabase client integration.
 * These types extend the generic AuthProviderClient to include
 * storage and realtime capabilities.
 */

import type { AuthSession } from "../stores/auth/types";

/**
 * Supabase session type - extends AuthSession
 */
export interface SupabaseSession extends AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

/**
 * Supabase user type
 */
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Storage file metadata
 */
export interface StorageFileMetadata {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Supabase storage response
 */
export interface StorageResponse<T> {
  data: T;
  error: null;
}

export interface StorageErrorResponse {
  data: null;
  error: {
    message: string;
    statusCode: string;
  };
}

/**
 * Realtime channel states
 */
export const REALTIME_CHANNEL_STATES = {
  CLOSED: "closed",
  CLOSING: "closing",
  INITIALIZED: "initialized",
  JOINING: "joining",
  JOINED: "joined",
  LEAVING: "leaving",
  REJOINING: "rejoining",
  ERRORED: "errored",
  TIMEOUT: "timed out",
} as const;

export type RealtimeChannelState =
  (typeof REALTIME_CHANNEL_STATES)[keyof typeof REALTIME_CHANNEL_STATES];

/**
 * Realtime postgres changes payload
 */
export interface RealtimePostgresChangesPayload<T = unknown> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  errors: null | Error[];
}

/**
 * Realtime broadcast payload
 */
export interface RealtimeBroadcastPayload<T = unknown> {
  event: string;
  payload: T;
  type: "broadcast";
}

/**
 * Realtime channel interface
 */
export interface RealtimeChannel {
  subscribe(
    callback?: (
      status: RealtimeChannelState | `${RealtimeChannelState}`,
      err?: Error,
    ) => void,
  ): this;
  unsubscribe(callback?: (status: `${RealtimeChannelState}`) => void): Promise<
    "ok" | "timed out" | "error"
  >;
  on<T = unknown>(
    type: "broadcast",
    filter: { event: string },
    callback: (payload: RealtimeBroadcastPayload<T>) => void,
  ): this;
  on<T = unknown>(
    type: "postgres_changes",
    filter: { event: string; schema: string; table: string },
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
  ): this;
  send(payload: {
    type: "broadcast";
    event: string;
    payload: unknown;
  }): Promise<"ok" | "timed out" | "error">;
}

/**
 * Supabase storage bucket interface
 */
export interface SupabaseStorageBucket {
  upload(
    path: string,
    file: File | Blob,
    options?: {
      upsert?: boolean;
      contentType?: string;
    },
  ): Promise<
    | { data: { path: string; id?: string }; error: null }
    | { data: null; error: { message: string } }
  >;
  download(path: string): Promise<
    | { data: Blob; error: null }
    | { data: null; error: { message: string } }
  >;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  createSignedUrl(
    path: string,
    expiresIn: number,
  ): Promise<
    | { data: { signedUrl: string }; error: null }
    | { data: null; error: { message: string } }
  >;
  createSignedUploadUrl(path: string): Promise<
    | { data: { token: string; path: string }; error: null }
    | { data: null; error: { message: string } }
  >;
  remove(paths: string[]): Promise<
    | { data: { name: string }[]; error: null }
    | { data: null; error: { message: string } }
  >;
  list(
    path?: string,
    options?: {
      limit?: number;
      offset?: number;
      search?: string;
    },
  ): Promise<
    | { data: StorageFileMetadata[]; error: null }
    | { data: null; error: { message: string } }
  >;
}

/**
 * Supabase storage interface
 */
export interface SupabaseStorage {
  from(bucket: string): SupabaseStorageBucket;
}

/**
 * Auth state change event type
 */
export type AuthStateChangeEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "TOKEN_REFRESHED"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "INITIAL_SESSION";

/**
 * Supabase auth interface
 *
 * This interface defines all auth operations available on Supabase client.
 * These are used by the SupabaseAuthGateway and auth store.
 */
export interface SupabaseAuth {
  /** Get the current session */
  getSession(): Promise<{ data: { session: SupabaseSession | null } }>;

  /** Subscribe to auth state changes */
  onAuthStateChange(
    callback: (event: AuthStateChangeEvent, session: SupabaseSession | null) => void,
  ): { data: { subscription: { unsubscribe(): void } } };

  /** Sign in with email and password */
  signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<{
    data: { user: SupabaseUser | null; session: SupabaseSession | null } | null;
    error: { message: string } | null;
  }>;

  /** Sign in with OTP/magic link */
  signInWithOtp(params: {
    email: string;
    options?: { shouldCreateUser?: boolean };
  }): Promise<{ error: { message: string } | null }>;

  /** Verify OTP code */
  verifyOtp(params: {
    email: string;
    token: string;
    type: "email" | "sms" | "totp" | "recovery" | "invite";
  }): Promise<{
    data: { user: SupabaseUser | null; session: SupabaseSession | null } | null;
    error: { message: string } | null;
  }>;

  /** Sign up with email and password */
  signUp(params: {
    email: string;
    password: string;
    options?: {
      data?: Record<string, unknown>;
    };
  }): Promise<{
    data: { user: SupabaseUser | null; session: SupabaseSession | null } | null;
    error: { message: string } | null;
  }>;

  /** Sign out the current user */
  signOut(): Promise<{ error: { message: string } | null }>;

  /** Refresh the current session */
  refreshSession(): Promise<{
    data: { session: SupabaseSession | null; user: SupabaseUser | null } | null;
    error: { message: string } | null;
  }>;
}

/**
 * Supabase realtime interface
 */
export interface SupabaseRealtime {
  channel(name: string): RealtimeChannel;
}

/**
 * Supabase client options
 */
export interface SupabaseClientOptions {
  auth?: {
    persistSession?: boolean;
    autoRefreshToken?: boolean;
    detectSessionInUrl?: boolean;
    storage?: {
      getItem: (key: string) => Promise<string | null> | string | null;
      setItem: (key: string, value: string) => Promise<void> | void;
      removeItem: (key: string) => Promise<void> | void;
    };
  };
  global?: {
    headers?: Record<string, string>;
  };
}

/**
 * Supabase client interface
 *
 * This is the main interface used throughout the application for
 * Supabase operations including auth, storage, and realtime.
 */
export interface SupabaseClient {
  auth: SupabaseAuth;
  storage: SupabaseStorage;
  realtime: SupabaseRealtime;
  channel(name: string): RealtimeChannel;
}

/**
 * Storage adapter type for compatibility
 */
export type StorageAdapter = SupabaseStorage;

/**
 * Realtime postgres insert payload (alias for compatibility)
 */
export type RealtimePostgresInsertPayload<T = unknown> =
  RealtimePostgresChangesPayload<T>;
