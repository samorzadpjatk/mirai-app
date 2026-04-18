import { Effect } from "effect";
import type {
  IStoragePort,
  CreateSignedUploadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlInput,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";
import { ApplicationError } from "@mirai-app/domain";

/**
 * In-Memory Storage Gateway
 *
 * Implements IStoragePort using in-memory storage for testing.
 * Simulates file operations and signed URL generation without actual Supabase Storage.
 */
export class InMemoryStorageGateway implements IStoragePort {
  private storage = new Map<string, Blob>();
  private uploadedFiles = new Map<string, string>();
  private tokenCounter = 0;

  upload(bucket: string, path: string, file: File | Blob) {
    return Effect.sync(() => {
      const key = `${bucket}/${path}`;
      this.storage.set(key, file);
      return { path, publicUrl: `https://mock-storage.example.com/${key}` };
    });
  }

  download(bucket: string, path: string) {
    return Effect.sync(() => {
      const key = `${bucket}/${path}`;
      const file = this.storage.get(key);
      if (!file) {
        throw new Error(`File not found: ${key}`);
      }
      return file;
    });
  }

  getPublicUrl(bucket: string, path: string): string {
    return `https://mock-storage.example.com/${bucket}/${path}`;
  }

  delete(bucket: string, path: string) {
    return Effect.sync(() => {
      const key = `${bucket}/${path}`;
      this.storage.delete(key);
    });
  }

  list(bucket: string, path?: string) {
    return Effect.sync(() => {
      const prefix = path ? `${bucket}/${path}/` : `${bucket}/`;
      return Array.from(this.storage.keys())
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.replace(prefix, ""));
    });
  }

  createSignedUploadUrl(input: CreateSignedUploadUrlInput) {
    return Effect.sync(() => {
      this.tokenCounter++;
      const token = `mock-upload-token-${this.tokenCounter}`;

      // Return mock upload URL in SeaweedFS native TUS format
      // Format: {endpoint}/tus/{bucket}/{path}?auth={token}
      const uploadUrl = `https://mock-storage.example.com/tus/${input.bucket}/${input.path}?auth=${token}`;

      return {
        token,
        uploadUrl,
        expiresIn: input.expiresInSeconds ?? 3600,
      };
    });
  }

  createSignedDownloadUrl(input: CreateSignedDownloadUrlInput) {
    return Effect.sync(() => {
      const fileKey = `${input.bucket}/${input.path}`;
      const mockSignedUrl = `https://mock-storage.example.com/${fileKey}?expires=${input.expiresInSeconds}&signature=mock-signature-${Date.now()}`;

      return { signedUrl: mockSignedUrl };
    });
  }

  /**
   * Helper method for testing - record a file as uploaded
   */
  recordUploadedFile(bucket: string, path: string, content?: string): void {
    const fileKey = `${bucket}/${path}`;
    this.uploadedFiles.set(fileKey, content ?? "mock-content");
  }

  /**
   * Helper method for testing - check if a file was uploaded
   */
  wasFileUploaded(bucket: string, path: string): boolean {
    const fileKey = `${bucket}/${path}`;
    return this.uploadedFiles.has(fileKey);
  }

  /**
   * Helper method for testing - get uploaded file content
   */
  getUploadedFileContent(bucket: string, path: string): string | undefined {
    const fileKey = `${bucket}/${path}`;
    return this.uploadedFiles.get(fileKey);
  }

  /**
   * Helper method for testing - clear all recorded uploads
   */
  clear(): void {
    this.uploadedFiles.clear();
    this.tokenCounter = 0;
    this.storage.clear();
  }
}
