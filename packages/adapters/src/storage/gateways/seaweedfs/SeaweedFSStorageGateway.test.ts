import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Effect, Either } from "effect";
import { SeaweedFSStorageGateway } from "./SeaweedFSStorageGateway";
import {
  StorageError,
  FileNotFoundError,
} from "../../errors/StorageErrors";
import type { SeaweedFSConfig } from "./SeaweedFSConfig";
import type { IStoragePort } from "@mirai-app/domain";

// ============================================================================
// Test Configuration
// ============================================================================

const mockS3Send = mock(() => Promise.resolve({}));

class MockS3Client {
  send = mockS3Send;
  config = {
    endpoint: "http://localhost:8333",
    region: "us-east-1",
  };
}

// Mock @aws-sdk/client-s3
mock.module("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: class PutObjectCommand {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class GetObjectCommand {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class DeleteObjectCommand {
    constructor(public input: unknown) {}
  },
  ListObjectsV2Command: class ListObjectsV2Command {
    constructor(public input: unknown) {}
  },
  NoSuchKey: class NoSuchKey extends Error {
    name = "NoSuchKey";
    constructor(message = "The specified key does not exist.") {
      super(message);
    }
  },
}));

// Mock @aws-sdk/s3-request-presigner
const mockGetSignedUrl = mock(() =>
  Promise.resolve("https://mock-presigned-url.example.com/test"),
);

mock.module("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));



// ============================================================================
// Test Configuration
// ============================================================================

const testSeaweedFSConfig: SeaweedFSConfig = {
  endpoint: "http://localhost:8333",
  region: "us-east-1",
  accessKeyId: "test-access-key",
  secretAccessKey: "test-secret-key",
  forcePathStyle: true,
  useSsl: false,
};

// ============================================================================
// Test Suite
// ============================================================================

describe("[UNIT] SeaweedFSStorageGateway", () => {
  let gateway: IStoragePort;

  beforeEach(() => {
    // Reset all mocks before each test
    mockS3Send.mockClear();
    mockGetSignedUrl.mockClear();

    // Create fresh gateway instance with simplified config
    gateway = new SeaweedFSStorageGateway(testSeaweedFSConfig);
  });

  describe("upload", () => {
    it("should upload file successfully and return path and publicUrl", async () => {
      // Arrange: Mock successful S3 response
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          ETag: '"mock-etag-123"',
          VersionId: "mock-version-123",
        }),
      );

      const file = new Blob(["test content"], { type: "text/plain" });
      const bucket = "test-bucket";
      const path = "uploads/test-file.txt";

      // Act
      const effect = gateway.upload(bucket, path, file);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.path).toBe(path);
        expect(either.right.publicUrl).toBe(
          `${testSeaweedFSConfig.endpoint}/${bucket}/${path}`,
        );
      }

      // Verify S3 client was called
      expect(mockS3Send).toHaveBeenCalled();
    });

    it("should extract correct content type from File", async () => {
      mockS3Send.mockImplementation(() => Promise.resolve({ ETag: '"etag"' }));

      const file = new File(["content"], "document.pdf", {
        type: "application/pdf",
      });

      const effect = gateway.upload("test-bucket", "docs/file.pdf", file);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should use octet-stream for Blob without type", async () => {
      mockS3Send.mockImplementation(() => Promise.resolve({ ETag: '"etag"' }));

      const blob = new Blob(["binary data"]); // No type specified

      const effect = gateway.upload("test-bucket", "data/binary.bin", blob);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with StorageError when S3 upload fails", async () => {
      // Arrange: Mock S3 failure
      mockS3Send.mockImplementation(() =>
        Promise.reject(new Error("S3 connection refused")),
      );

      const file = new Blob(["test content"]);

      // Act
      const effect = gateway.upload("test-bucket", "test.txt", file);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error._tag).toBe("StorageError");
        expect(error.operation).toBe("upload");
      }
    });

    it("should fail with StorageError when file.arrayBuffer fails", async () => {
      // Create a mock file that throws when arrayBuffer is called
      const failingFile = {
        arrayBuffer: () => Promise.reject(new Error("File read error")),
        type: "text/plain",
        size: 12,
      } as unknown as File;

      // Act
      const effect = gateway.upload("test-bucket", "test.txt", failingFile);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error.operation).toBe("upload");
      }
    });
  });

  describe("download", () => {
    it("should download file successfully and return Blob", async () => {
      // Arrange: Mock S3 response with readable stream
      const testContent = Buffer.from("downloaded file content");
      const mockStream = (async function* () {
        yield testContent;
      })();

      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Body: mockStream,
          ContentType: "text/plain",
          ContentLength: testContent.length,
        }),
      );

      // Act
      const effect = gateway.download("test-bucket", "files/test.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeInstanceOf(Blob);
      }
    });

    it("should fail with FileNotFoundError when file does not exist (NoSuchKey)", async () => {
      // Arrange: Mock NoSuchKey error
      const { NoSuchKey } = await import("@aws-sdk/client-s3");
      mockS3Send.mockImplementation(() =>
        Promise.reject(new NoSuchKey("The specified key does not exist.")),
      );

      // Act
      const effect = gateway.download("test-bucket", "non-existent.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(FileNotFoundError);
        const error = either.left as FileNotFoundError;
        expect(error._tag).toBe("FileNotFoundError");
        expect(error.bucket).toBe("test-bucket");
        expect(error.path).toBe("non-existent.txt");
      }
    });

    it("should fail with FileNotFoundError when response body is empty", async () => {
      // Arrange: Mock response with no body
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Body: null,
          ContentType: "text/plain",
        }),
      );

      // Act
      const effect = gateway.download("test-bucket", "empty-file.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(FileNotFoundError);
      }
    });

    it("should fail with StorageError when stream read fails", async () => {
      // Arrange: Mock stream that throws during iteration
      const failingStream = (async function* () {
        throw new Error("Stream read error");
      })();

      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Body: failingStream,
          ContentType: "text/plain",
        }),
      );

      // Act
      const effect = gateway.download("test-bucket", "corrupt-file.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error.operation).toBe("download");
      }
    });

    it("should fail with StorageError for general S3 errors", async () => {
      // Arrange: Mock generic S3 error
      mockS3Send.mockImplementation(() =>
        Promise.reject(new Error("Internal S3 error")),
      );

      // Act
      const effect = gateway.download("test-bucket", "test.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
      }
    });
  });

  describe("delete", () => {
    it("should delete file successfully", async () => {
      // Arrange: Mock successful delete
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          DeleteMarker: true,
          VersionId: "mock-version",
        }),
      );

      // Act
      const effect = gateway.delete("test-bucket", "files/to-delete.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      expect(mockS3Send).toHaveBeenCalled();
    });

    it("should succeed even when file does not exist (S3 idempotent delete)", async () => {
      // S3 delete is idempotent - success even if key doesn't exist
      mockS3Send.mockImplementation(() => Promise.resolve({}));

      const effect = gateway.delete("test-bucket", "non-existent.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
    });

    it("should fail with StorageError when S3 delete fails", async () => {
      // Arrange: Mock S3 failure
      mockS3Send.mockImplementation(() =>
        Promise.reject(new Error("S3 service unavailable")),
      );

      // Act
      const effect = gateway.delete("test-bucket", "files/test.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error.operation).toBe("delete");
      }
    });
  });

  describe("list", () => {
    it("should list files with prefix", async () => {
      // Arrange: Mock S3 list response
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Contents: [
            { Key: "prefix/file1.txt", Size: 100 },
            { Key: "prefix/file2.txt", Size: 200 },
            { Key: "prefix/subfolder/file3.txt", Size: 300 },
          ],
          IsTruncated: false,
          MaxKeys: 1000,
        }),
      );

      // Act
      const effect = gateway.list("test-bucket", "prefix/");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(3);
        expect(either.right).toContain("prefix/file1.txt");
        expect(either.right).toContain("prefix/file2.txt");
        expect(either.right).toContain("prefix/subfolder/file3.txt");
      }
    });

    it("should return empty array when bucket is empty", async () => {
      // Arrange: Mock empty response
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Contents: [],
          IsTruncated: false,
        }),
      );

      // Act
      const effect = gateway.list("test-bucket", "empty/");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toEqual([]);
      }
    });

    it("should handle undefined path parameter", async () => {
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Contents: [{ Key: "root-file.txt", Size: 100 }],
          IsTruncated: false,
        }),
      );

      const effect = gateway.list("test-bucket");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toContain("root-file.txt");
      }
    });

    it("should filter out empty keys", async () => {
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          Contents: [
            { Key: "", Size: 0 }, // Empty key (folder placeholder)
            { Key: "valid-file.txt", Size: 100 },
          ],
          IsTruncated: false,
        }),
      );

      const effect = gateway.list("test-bucket", "prefix/");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toHaveLength(1);
        expect(either.right).toContain("valid-file.txt");
      }
    });

    it("should handle undefined Contents", async () => {
      mockS3Send.mockImplementation(() =>
        Promise.resolve({
          IsTruncated: false,
          // Contents is undefined
        }),
      );

      const effect = gateway.list("test-bucket");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toEqual([]);
      }
    });

    it("should fail with StorageError when S3 list fails", async () => {
      // Arrange: Mock S3 failure
      mockS3Send.mockImplementation(() =>
        Promise.reject(new Error("Access denied")),
      );

      // Act
      const effect = gateway.list("test-bucket", "prefix/");
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error.operation).toBe("list");
      }
    });
  });

  describe("getPublicUrl", () => {
    it("should return public URL with path-style format", () => {
      const bucket = "test-bucket";
      const path = "files/image.png";

      const url = gateway.getPublicUrl(bucket, path);

      expect(url).toBe(`${testSeaweedFSConfig.endpoint}/${bucket}/${path}`);
    });

    it("should handle paths with leading slash by normalizing double slashes", () => {
      const bucket = "test-bucket";
      const path = "/files/image.png";

      const url = gateway.getPublicUrl(bucket, path);

      // The implementation concatenates endpoint + "/" + bucket + "/" + path
      // With leading slash in path, this creates double slashes
      expect(url).toContain(testSeaweedFSConfig.endpoint);
      expect(url).toContain(bucket);
      expect(url).toContain("/files/image.png");
    });

    it("should handle endpoint with trailing slash", () => {
      // Create gateway with trailing slash in endpoint
      const configWithTrailingSlash: SeaweedFSConfig = {
        ...testSeaweedFSConfig,
        endpoint: "http://localhost:8333/",
      };

      const gatewayWithSlash = new SeaweedFSStorageGateway(
        configWithTrailingSlash,
      );

      const url = gatewayWithSlash.getPublicUrl("test-bucket", "files/test.txt");

      expect(url).toBe("http://localhost:8333/test-bucket/files/test.txt");
    });
  });

  describe("createSignedUploadUrl", () => {
    it("should create upload URL with native TUS endpoint", async () => {
      const input = {
        bucket: "uploads",
        path: "user-files/file.txt",
        upsert: false,
        expiresInSeconds: 1800,
      };

      // Act - run the effect directly since crypto is available in Bun
      const result = await Effect.runPromise(gateway.createSignedUploadUrl(input));

      // Assert
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe("string");
      expect(result.token.length).toBeGreaterThan(0);

      expect(result.uploadUrl).toBeDefined();
      expect(typeof result.uploadUrl).toBe("string");
      expect(result.expiresIn).toBe(1800);

      // URL should be SeaweedFS Filer TUS endpoint
      expect(result.uploadUrl).toContain("/tus/");
      expect(result.uploadUrl).toContain("uploads");
      expect(result.uploadUrl).toContain("user-files/file.txt");
      expect(result.uploadUrl).toContain("auth=");
      expect(result.uploadUrl).toContain(result.token);
    });

    it("should generate unique tokens for each call", async () => {
    const input = {
      bucket: "test-bucket",
      path: "test/file.txt",
      upsert: false,
      expiresInSeconds: 3600,
    };

      const result1 = await Effect.runPromise(gateway.createSignedUploadUrl(input));
      const result2 = await Effect.runPromise(gateway.createSignedUploadUrl(input));

      // Tokens should be unique
      expect(result1.token).not.toBe(result2.token);
      // URLs should be different (different auth tokens)
      expect(result1.uploadUrl).not.toBe(result2.uploadUrl);
    });

    it("should use default expiration when not specified", async () => {
      const input = {
        bucket: "uploads",
        path: "files/test.txt",
      };

      const result = await Effect.runPromise(gateway.createSignedUploadUrl(input));

      // Default expiration is 3600 seconds (1 hour)
      expect(result.expiresIn).toBe(3600);
    });

    it("should handle endpoint with trailing slash", async () => {
      const configWithTrailingSlash: SeaweedFSConfig = {
        ...testSeaweedFSConfig,
        endpoint: "http://localhost:8333/",
      };

      const gatewayWithTrailingSlash = new SeaweedFSStorageGateway(
        configWithTrailingSlash,
      );

      const input = {
        bucket: "uploads",
        path: "files/test.txt",
      };

      const result = await Effect.runPromise(gatewayWithTrailingSlash.createSignedUploadUrl(input));

      // Should normalize double slashes - check no "//tus" pattern exists
      expect(result.uploadUrl).toContain("http://localhost:8333/tus/");
      // Should not have double slashes before tus
      const urlWithoutProtocol = result.uploadUrl.replace("http://", "").replace("https://", "");
      expect(urlWithoutProtocol.includes("//")).toBe(false);
    });
  });

  describe("createSignedDownloadUrl", () => {
    it("should generate presigned URL successfully", async () => {
      // Arrange: Mock presigned URL generation
      const mockUrl = "https://seaweedfs.example.com/bucket/file.txt?signature=abc123";
      mockGetSignedUrl.mockImplementation(() => Promise.resolve(mockUrl));

      const input = {
        bucket: "downloads",
        path: "files/document.pdf",
        expiresInSeconds: 900, // 15 minutes
      };

      // Act
      const effect = gateway.createSignedDownloadUrl(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.signedUrl).toBe(mockUrl);
        expect(either.right.expiresIn).toBe(900);
        expect(either.right.path).toBe("files/document.pdf");
      }

      // Verify getSignedUrl was called with correct parameters
      expect(mockGetSignedUrl).toHaveBeenCalled();
    });

    it("should use custom expiration time", async () => {
      mockGetSignedUrl.mockImplementation(() =>
        Promise.resolve("https://example.com/signed-url"),
      );

      const input = {
        bucket: "downloads",
        path: "files/image.png",
        expiresInSeconds: 3600, // 1 hour
      };

      const effect = gateway.createSignedDownloadUrl(input);
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right.expiresIn).toBe(3600);
      }
    });

    it("should fail with StorageError when presigned URL generation fails", async () => {
      // Arrange: Mock presigned URL failure
      mockGetSignedUrl.mockImplementation(() =>
        Promise.reject(new Error("Credential error")),
      );

      const input = {
        bucket: "downloads",
        path: "files/test.txt",
        expiresInSeconds: 900,
      };

      // Act
      const effect = gateway.createSignedDownloadUrl(input);
      const either = await Effect.runPromise(Effect.either(effect));

      // Assert
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(StorageError);
        const error = either.left as StorageError;
        expect(error.operation).toBe("createSignedDownloadUrl");
      }
    });
  });

  describe("Effect error handling patterns", () => {
    it("should use Either.isLeft for error cases and Either.isRight for success", async () => {
      // Test success case
      mockS3Send.mockImplementation(() => Promise.resolve({ ETag: '"etag"' }));

      const successEffect = gateway.upload("bucket", "path.txt", new Blob(["test"]));
      const successEither = await Effect.runPromise(Effect.either(successEffect));

      expect(Either.isRight(successEither)).toBe(true);
      expect(Either.isLeft(successEither)).toBe(false);

      // Test error case
      mockS3Send.mockImplementation(() => Promise.reject(new Error("fail")));

      const errorEffect = gateway.upload("bucket", "path.txt", new Blob(["test"]));
      const errorEither = await Effect.runPromise(Effect.either(errorEffect));

      expect(Either.isLeft(errorEither)).toBe(true);
      expect(Either.isRight(errorEither)).toBe(false);
    });

    it("should use instanceof for error type checking", async () => {
      // Test FileNotFoundError
      const { NoSuchKey } = await import("@aws-sdk/client-s3");
      mockS3Send.mockImplementation(() =>
        Promise.reject(new NoSuchKey("Key not found")),
      );

      const effect = gateway.download("bucket", "missing.txt");
      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(FileNotFoundError);
        expect(either.left._tag).toBe("FileNotFoundError");
      }

      // Test StorageError
      mockS3Send.mockImplementation(() => Promise.reject(new Error("S3 down")));

      const effect2 = gateway.download("bucket", "file.txt");
      const either2 = await Effect.runPromise(Effect.either(effect2));

      expect(Either.isLeft(either2)).toBe(true);
      if (Either.isLeft(either2)) {
        expect(either2.left).toBeInstanceOf(StorageError);
        expect(either2.left._tag).toBe("StorageError");
      }
    });
  });

  describe("constructor and configuration", () => {
    it("should create gateway with valid configuration", () => {
      const newGateway = new SeaweedFSStorageGateway(testSeaweedFSConfig);

      expect(newGateway).toBeDefined();
      expect(typeof newGateway.upload).toBe("function");
      expect(typeof newGateway.download).toBe("function");
      expect(typeof newGateway.delete).toBe("function");
      expect(typeof newGateway.list).toBe("function");
      expect(typeof newGateway.getPublicUrl).toBe("function");
      expect(typeof newGateway.createSignedUploadUrl).toBe("function");
      expect(typeof newGateway.createSignedDownloadUrl).toBe("function");
    });

    it("should accept only SeaweedFSConfig (simplified constructor)", () => {
      // The simplified gateway only requires SeaweedFSConfig
      // No more TusdConfig, RedisConfig, or TicketConfig needed
      const minimalGateway = new SeaweedFSStorageGateway({
        endpoint: "http://seaweedfs:8333",
        region: "us-east-1",
        accessKeyId: "key",
        secretAccessKey: "secret",
        forcePathStyle: true,
        useSsl: false,
      });

      expect(minimalGateway).toBeDefined();
      expect(typeof minimalGateway.upload).toBe("function");
      expect(typeof minimalGateway.createSignedUploadUrl).toBe("function");
    });
  });
});
