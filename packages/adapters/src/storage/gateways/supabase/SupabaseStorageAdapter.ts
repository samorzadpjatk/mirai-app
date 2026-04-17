import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type {
  IStoragePort,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * Supabase Storage Adapter
 *
 * Implements IStoragePort using Supabase Storage client for file operations
 * and signed URL generation.
 */
export class SupabaseStorageAdapter implements IStoragePort {
  constructor(private readonly supabase: SupabaseClient) {}

  upload(
    bucket: string,
    path: string,
    file: File | Blob,
  ): Effect.Effect<
    { path: string; publicUrl: string | null },
    ApplicationError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .upload(path, file);
        if (error) throw error;
        const {
          data: { publicUrl },
        } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
        return { path: data.path, publicUrl };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.upload",
          cause: error,
        }),
    });
  }

  download(
    bucket: string,
    path: string,
  ): Effect.Effect<Blob, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .download(path);
        if (error) throw error;
        return data;
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.download",
          cause: error,
        }),
    });
  }

  getPublicUrl(bucket: string, path: string): string {
    const {
      data: { publicUrl },
    } = this.supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  }

  delete(
    bucket: string,
    path: string,
  ): Effect.Effect<void, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { error } = await this.supabase.storage
          .from(bucket)
          .remove([path]);
        if (error) throw error;
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.delete",
          cause: error,
        }),
    });
  }

  list(
    bucket: string,
    path?: string,
  ): Effect.Effect<string[], ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(bucket)
          .list(path ?? "");
        if (error) throw error;
        return data.map((item) => item.name);
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.list",
          cause: error,
        }),
    });
  }

  createSignedUploadUrl(
    input: CreateSignedUploadUrlInput,
  ): Effect.Effect<CreateSignedUploadUrlResult, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(input.bucket)
          .createSignedUploadUrl(input.path);

        if (error) {
          throw error;
        }

        if (!data || !data.token) {
          throw new Error(
            "Failed to create signed upload URL: no token returned",
          );
        }

        return { token: data.token };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.createSignedUploadUrl",
          cause: error,
          id: `${input.bucket}/${input.path}`,
        }),
    });
  }

  createSignedDownloadUrl(
    input: CreateSignedDownloadUrlInput,
  ): Effect.Effect<CreateSignedDownloadUrlResult, ApplicationError, never> {
    return Effect.tryPromise({
      try: async () => {
        const { data, error } = await this.supabase.storage
          .from(input.bucket)
          .createSignedUrl(input.path, input.expiresInSeconds);

        if (error) {
          throw error;
        }

        if (!data || !data.signedUrl) {
          throw new Error(
            "Failed to create signed download URL: no URL returned",
          );
        }

        return { signedUrl: data.signedUrl };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageAdapter.createSignedDownloadUrl",
          cause: error,
          id: `${input.bucket}/${input.path}`,
        }),
    });
  }
}
