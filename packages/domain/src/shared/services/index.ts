import type { Effect } from "effect";
import type { IPortError } from "../errors/ports";

/**
 * Interface for authentication operations via Supabase
 */
export interface IAuthPort {
  /** Sign in with email and password */
  signInWithPassword(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  /** Sign in with OTP code (magic link/one-time password) */
  signInWithOtp(
    email: string,
    otp: string,
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  /** Sign up with email and password */
  signUp(
    email: string,
    password: string,
  ): Effect.Effect<
    { user: { id: string; email: string } | null },
    IPortError,
    never
  >;

  /** Sign out the current user */
  signOut(): Effect.Effect<void, IPortError, never>;

  /** Get the current session */
  getSession(): Effect.Effect<
    { user: { id: string; email: string } | null; accessToken: string | null },
    IPortError,
    never
  >;

  /** Refresh the current session */
  refreshSession(): Effect.Effect<
    { session: { accessToken: string } | null },
    IPortError,
    never
  >;
}

/**
 * Input for creating a signed upload URL
 */
export interface CreateSignedUploadUrlInput {
  bucket: string;
  path: string;
  upsert: boolean;
}

/**
 * Result of creating a signed upload URL
 */
export interface CreateSignedUploadUrlResult {
  token: string;
}

/**
 * Input for creating a signed download URL
 */
export interface CreateSignedDownloadUrlInput {
  bucket: string;
  path: string;
  expiresInSeconds: number;
}

/**
 * Result of creating a signed download URL
 */
export interface CreateSignedDownloadUrlResult {
  signedUrl: string;
}

/**
 * Interface for storage operations via Supabase Storage
 */
export interface IStoragePort {
  /** Upload a file to storage */
  upload(
    bucket: string,
    path: string,
    file: File | Blob,
  ): Effect.Effect<
    { path: string; publicUrl: string | null },
    IPortError,
    never
  >;

  /** Download a file from storage */
  download(
    bucket: string,
    path: string,
  ): Effect.Effect<Blob, IPortError, never>;

  /** Get a public URL for a file */
  getPublicUrl(bucket: string, path: string): string;

  /** Delete a file from storage */
  delete(bucket: string, path: string): Effect.Effect<void, IPortError, never>;

  /** List files in a bucket */
  list(
    bucket: string,
    path?: string,
  ): Effect.Effect<string[], IPortError, never>;

  /** Create a signed upload URL for resumable uploads */
  createSignedUploadUrl(
    input: CreateSignedUploadUrlInput,
  ): Effect.Effect<CreateSignedUploadUrlResult, IPortError, never>;

  /** Create a signed download URL for temporary access */
  createSignedDownloadUrl(
    input: CreateSignedDownloadUrlInput,
  ): Effect.Effect<CreateSignedDownloadUrlResult, IPortError, never>;
}

/**
 * Interface for realtime operations via Supabase Realtime
 */
export interface IRealtimePort {
  /** Subscribe to a channel */
  subscribe(
    channel: string,
    callback: (payload: unknown) => void,
  ): Effect.Effect<{ unsubscribe: () => void }, IPortError, never>;

  /** Broadcast a message to a channel */
  broadcast(
    channel: string,
    event: string,
    payload: unknown,
  ): Effect.Effect<void, IPortError, never>;
}
