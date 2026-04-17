import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IStoragePort } from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";
import type {
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";

/**
 * Supabase Storage Gateway
 *
 * Implements IStoragePort using Supabase Storage client for file operations
 * and signed URL generation.
 */
export class SupabaseStorageGateway implements IStoragePort {
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
          operation: "SupabaseStorageGateway.upload",
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
          operation: "SupabaseStorageGateway.download",
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
          operation: "SupabaseStorageGateway.delete",
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
          operation: "SupabaseStorageGateway.list",
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
        if (error) throw error;
        return { token: data.token };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageGateway.createSignedUploadUrl",
          cause: error,
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
        if (error) throw error;
        return { signedUrl: data.signedUrl };
      },
      catch: (error) =>
        new ApplicationError({
          operation: "SupabaseStorageGateway.createSignedDownloadUrl",
          cause: error,
        }),
    });
  }
}
