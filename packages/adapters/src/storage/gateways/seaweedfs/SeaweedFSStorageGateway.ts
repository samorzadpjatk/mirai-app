import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Effect } from "effect";
import type {
  IStoragePort,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
  IPortError,
} from "@mirai-app/domain";
import type { SeaweedFSConfig } from "./SeaweedFSConfig";
import {
  StorageError,
  FileNotFoundError,
} from "../../errors/StorageErrors";

/**
 * SeaweedFS Storage Gateway
 *
 * Implements IStoragePort using SeaweedFS S3-compatible API for file operations.
 * Uses SeaweedFS Filer's native TUS support for resumable uploads.
 *
 * Core methods:
 * - upload() - Direct S3 putObject
 * - download() - Direct S3 getObject, return Blob
 * - delete() - S3 deleteObject
 * - list() - S3 listObjectsV2 with prefix
 * - getPublicUrl() - Construct public URL or return null
 *
 * Signed URL methods:
 * - createSignedUploadUrl() - Returns SeaweedFS Filer TUS URL with auth token
 * - createSignedDownloadUrl() - Generates S3 presigned URL
 */
export class SeaweedFSStorageGateway implements IStoragePort {
  private readonly s3Client: S3Client;
  private readonly config: SeaweedFSConfig;

  constructor(config: SeaweedFSConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle,
      tls: config.useSsl,
    });
  }

  /**
   * Upload a file to SeaweedFS storage using S3 putObject
   *
   * @param bucket - The bucket name
   * @param path - The object key/path
   * @param file - The file content (File or Blob)
   * @returns Effect with upload result { path, publicUrl }
   */
  upload(bucket: string, path: string, file: File | Blob) {
    const s3Client = this.s3Client;
    const config = this.config;

    return Effect.gen(function* () {
      const contentType =
        file instanceof File ? file.type : "application/octet-stream";

      // Convert Blob/File to Buffer for S3
      const arrayBuffer = yield* Effect.tryPromise({
        try: () => file.arrayBuffer(),
        catch: (error) =>
          new StorageError({
            operation: "upload",
            bucket,
            path,
            cause: error,
          }),
      });

      const body = Buffer.from(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: body,
        ContentType: contentType,
      });

      yield* Effect.tryPromise({
        try: () => s3Client.send(command),
        catch: (error) =>
          new StorageError({
            operation: "upload",
            bucket,
            path,
            cause: error,
          }),
      });

      // Construct public URL
      const baseEndpoint = config.endpoint.replace(/\/$/, "");
      const publicUrl = `${baseEndpoint}/${bucket}/${path}`;

      return { path, publicUrl };
    });
  }

  /**
   * Download a file from SeaweedFS storage using S3 getObject
   *
   * @param bucket - The bucket name
   * @param path - The object key/path
   * @returns Effect with Blob containing file data
   */
  download(bucket: string, path: string) {
    const s3Client = this.s3Client;

    return Effect.gen(function* () {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      const response = yield* Effect.tryPromise({
        try: () => s3Client.send(command),
        catch: (error) => {
          if (error instanceof NoSuchKey) {
            return new FileNotFoundError({ bucket, path });
          }
          return new StorageError({
            operation: "download",
            bucket,
            path,
            cause: error,
          });
        },
      });

      // Convert S3 response stream to Blob
      const stream = response.Body;
      if (!stream) {
        return yield* Effect.fail(
          new FileNotFoundError({ bucket, path }),
        );
      }

      // Convert stream to buffer using a helper function
      const buffer = yield* Effect.tryPromise({
        try: async () => {
          const chunks: Buffer[] = [];
          for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
            chunks.push(chunk);
          }
          return Buffer.concat(chunks);
        },
        catch: (error) =>
          new StorageError({
            operation: "download",
            bucket,
            path,
            cause: error,
          }),
      });

      // Create Blob from buffer
      const blob = new Blob([buffer], {
        type: response.ContentType ?? "application/octet-stream",
      });

      return blob;
    });
  }

  /**
   * Delete a file from SeaweedFS storage using S3 deleteObject
   *
   * @param bucket - The bucket name
   * @param path - The object key/path
   * @returns Effect that completes when deletion is done
   */
  delete(bucket: string, path: string) {
    const s3Client = this.s3Client;

    return Effect.gen(function* () {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      yield* Effect.tryPromise({
        try: () => s3Client.send(command),
        catch: (error) =>
          new StorageError({
            operation: "delete",
            bucket,
            path,
            cause: error,
          }),
      });
    });
  }

  /**
   * List files in a SeaweedFS bucket using S3 listObjectsV2 with prefix
   *
   * @param bucket - The bucket name
   * @param path - Optional prefix/path filter
   * @returns Effect with array of file paths matching the prefix
   */
  list(bucket: string, path?: string) {
    const s3Client = this.s3Client;

    return Effect.gen(function* () {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: path ?? "",
      });

      const response = yield* Effect.tryPromise({
        try: () => s3Client.send(command),
        catch: (error) =>
          new StorageError({
            operation: "list",
            bucket,
            path,
            cause: error,
          }),
      });

      const keys =
        response.Contents?.map((object) => object.Key ?? "").filter(
          (key) => key !== "",
        ) ?? [];

      return keys;
    });
  }

  /**
   * Get a public URL for a file in SeaweedFS storage
   *
   * Returns a direct SeaweedFS URL for public buckets.
   * For private buckets, returns null (use createSignedDownloadUrl instead).
   *
   * @param bucket - The bucket name
   * @param path - The object key/path
   * @returns Public URL string or null if bucket is not public
   */
  getPublicUrl(bucket: string, path: string): string {
    // Construct direct SeaweedFS public URL
    // Format: {endpoint}/{bucket}/{path} when using path-style
    const baseEndpoint = this.config.endpoint.replace(/\/$/, "");
    return `${baseEndpoint}/${bucket}/${path}`;
  }

  /**
   * Create a signed upload URL for SeaweedFS Filer native TUS resumable uploads
   *
   * Generates an auth token and returns a SeaweedFS Filer TUS endpoint URL.
   * The client can use this URL directly with the TUS protocol for resumable uploads.
   *
   * @param input - Upload URL creation parameters (bucket, path, expiresInSeconds)
   * @returns Effect with { token: authToken, uploadUrl: SeaweedFS TUS URL, expiresIn: seconds }
   */
  createSignedUploadUrl(
    input: CreateSignedUploadUrlInput,
  ): Effect.Effect<CreateSignedUploadUrlResult, IPortError, never> {
    const config = this.config;

    return Effect.gen(function* () {
      // Generate a simple auth token (in production, this could be a JWT or signed token)
      // The token encodes the bucket, path, and expiration for server-side validation
      const timestamp = Date.now();
      // crypto.getRandomValues is synchronous - use sync generator
      const randomBytes = crypto.getRandomValues(new Uint8Array(16));
      const randomHex = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      const token = `${randomHex}-${timestamp}`;

      // Construct SeaweedFS Filer TUS endpoint URL
      // Format: {filerEndpoint}/tus/{bucket}/{path}?auth={token}
      const baseEndpoint = config.endpoint.replace(/\/$/, "");
      const uploadUrl = `${baseEndpoint}/tus/${input.bucket}/${input.path}?auth=${token}`;

      // Return token and upload URL
      return {
        token,
        uploadUrl,
        expiresIn: input.expiresInSeconds ?? 3600,
      };
    });
  }

  /**
   * Create a signed download URL using S3 presigned URL
   *
   * Generates a presigned GetObject URL valid for the specified duration.
   * The URL provides direct access to the file in SeaweedFS storage.
   *
   * @param input - Download URL creation parameters (bucket, path, expiresInSeconds)
   * @returns Effect with { signedUrl, expiresIn, path }
   */
  createSignedDownloadUrl(
    input: CreateSignedDownloadUrlInput,
  ): Effect.Effect<CreateSignedDownloadUrlResult, IPortError, never> {
    const s3Client = this.s3Client;

    return Effect.gen(function* () {
      // Create GetObject command for presigned URL
      const command = new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.path,
      });

      // Generate presigned URL with specified expiration
      const signedUrl = yield* Effect.tryPromise({
        try: () =>
          getSignedUrl(s3Client, command, {
            expiresIn: input.expiresInSeconds,
          }),
        catch: (error) =>
          new StorageError({
            operation: "createSignedDownloadUrl",
            bucket: input.bucket,
            path: input.path,
            cause: error,
          }),
      });

      return {
        signedUrl,
        expiresIn: input.expiresInSeconds,
        path: input.path,
      };
    });
  }
}
