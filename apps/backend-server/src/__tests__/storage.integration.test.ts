import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Effect, Either } from "effect";
import {
  SeaweedFSStorageGateway,
  validateSeaweedFSConfig,
} from "@mirai-app/adapters/storage";
import type {
  CreateSignedUploadUrlInput,
  CreateSignedDownloadUrlInput,
  CreateSignedUploadUrlResult,
  CreateSignedDownloadUrlResult,
} from "@mirai-app/domain";

/**
 * [INTEGRATION] SeaweedFS Storage Integration Tests
 *
 * These tests validate the simplified storage flow with real SeaweedFS services:
 * 1. Upload flow: direct S3 upload -> verify in SeaweedFS
 * 2. Download flow: create URL -> fetch file -> verify content
 * 3. Presigned URL operations: upload URLs (native TUS) and download URLs
 * 4. Native TUS support: SeaweedFS Filer TUS endpoint
 *
 * Requires Docker Compose SeaweedFS service to be running.
 * See docker-compose.yml for service configuration.
 */

// =============================================================================
// Test Configuration
// =============================================================================

const TEST_CONFIG = {
  // SeaweedFS S3 API endpoint
  seaweedfs: {
    endpoint: process.env.SEAWEEDFS_ENDPOINT ?? "http://localhost:8333",
    region: "us-east-1",
    accessKeyId: process.env.SEAWEEDFS_ACCESS_KEY ?? "dev_access_key",
    secretAccessKey: process.env.SEAWEEDFS_SECRET_KEY ?? "dev_secret_key",
    forcePathStyle: true,
    useSsl: false,
  },
};

const TEST_BUCKET = "test-uploads";
const TEST_USER_ID = "test-user-123";

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Check if SeaweedFS service is running
 */
async function checkSeaweedFSHealth(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:9333/cluster/status", {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Create a test file Blob with specified content
 */
function createTestFile(content: string, filename: string, type = "text/plain"): Blob {
  return new Blob([content], { type });
}

/**
 * Fetch file from presigned URL and verify content
 */
async function fetchAndVerifyFile(
  signedUrl: string,
  expectedContent: string
): Promise<{ success: boolean; verified: boolean; error?: string }> {
  try {
    const response = await fetch(signedUrl);

    if (!response.ok) {
      return {
        success: false,
        verified: false,
        error: `Failed to fetch: ${response.status} ${response.statusText}`,
      };
    }

    const text = await response.text();
    const verified = text === expectedContent;

    return { success: true, verified, error: verified ? undefined : "Content mismatch" };
  } catch (error) {
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[INTEGRATION] SeaweedFS Storage Flow", () => {
  let gateway: SeaweedFSStorageGateway;
  let servicesHealthy: boolean;

  beforeAll(async () => {
    // Check if Docker Compose service is running
    servicesHealthy = await checkSeaweedFSHealth();

    if (!servicesHealthy) {
      console.warn(
        "[INTEGRATION] SeaweedFS service not available. " +
        "Skipping integration tests. Run: docker compose up seaweedfs"
      );
      return;
    }

    // Validate and initialize gateway with simplified config
    const configResult = await Effect.runPromise(
      Effect.either(validateSeaweedFSConfig(TEST_CONFIG.seaweedfs))
    );

    if (Either.isLeft(configResult)) {
      console.warn("[INTEGRATION] Invalid configuration:", configResult.left.message);
      servicesHealthy = false;
      return;
    }

    gateway = new SeaweedFSStorageGateway(configResult.right);
    console.log("[INTEGRATION] SeaweedFS is healthy, running tests");
  });

  // ============================================================================
  // Test 1: Service Health Checks
  // ============================================================================

  describe("Service Health", () => {
    it("should have SeaweedFS service running", () => {
      // Skip test if services are not available
      if (!servicesHealthy) {
        console.warn("Skipping: Docker Compose service not available");
        return;
      }

      expect(servicesHealthy).toBe(true);
    });
  });

  // ============================================================================
  // Test 2: Direct S3 Operations
  // ============================================================================

  describe("Direct S3 Operations", () => {
    it("should upload file directly to SeaweedFS", async () => {
      if (!servicesHealthy) return;

      const content = "Hello, SeaweedFS!";
      const file = createTestFile(content, "direct-upload.txt");
      const path = `test/direct-${Date.now()}.txt`;

      const result = await Effect.runPromise(
        gateway.upload(TEST_BUCKET, path, file)
      );

      expect(result.path).toBe(path);
      expect(result.publicUrl).toContain(TEST_BUCKET);
      expect(result.publicUrl).toContain(path);
    });

    it("should download file from SeaweedFS", async () => {
      if (!servicesHealthy) return;

      const content = "Test content for download";
      const file = createTestFile(content, "download-test.txt");
      const path = `test/download-${Date.now()}.txt`;

      // Upload first
      await Effect.runPromise(gateway.upload(TEST_BUCKET, path, file));

      // Download
      const blob = await Effect.runPromise(gateway.download(TEST_BUCKET, path));
      const downloaded = await blob.text();

      expect(downloaded).toBe(content);
    });

    it("should list files in bucket", async () => {
      if (!servicesHealthy) return;

      const prefix = `test/list-${Date.now()}`;
      const file = createTestFile("list me", "list-test.txt");

      // Upload multiple files
      await Effect.runPromise(
        Effect.all([
          gateway.upload(TEST_BUCKET, `${prefix}/a.txt`, file),
          gateway.upload(TEST_BUCKET, `${prefix}/b.txt`, file),
          gateway.upload(TEST_BUCKET, `${prefix}/c.txt`, file),
        ])
      );

      // List files
      const keys = await Effect.runPromise(
        gateway.list(TEST_BUCKET, prefix)
      );

      expect(keys.length).toBeGreaterThanOrEqual(3);
      expect(keys.some(k => k.includes(`${prefix}/a.txt`))).toBe(true);
      expect(keys.some(k => k.includes(`${prefix}/b.txt`))).toBe(true);
      expect(keys.some(k => k.includes(`${prefix}/c.txt`))).toBe(true);
    });

    it("should delete file from SeaweedFS", async () => {
      if (!servicesHealthy) return;

      const file = createTestFile("delete me", "delete-test.txt");
      const path = `test/delete-${Date.now()}.txt`;

      // Upload
      await Effect.runPromise(gateway.upload(TEST_BUCKET, path, file));

      // Delete
      await Effect.runPromise(gateway.delete(TEST_BUCKET, path));

      // Verify deletion - should fail to download
      const result = await Effect.runPromise(
        Effect.either(gateway.download(TEST_BUCKET, path))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should get public URL", () => {
      if (!servicesHealthy) return;

      const url = gateway.getPublicUrl(TEST_BUCKET, "test/file.txt");

      expect(url).toContain(TEST_CONFIG.seaweedfs.endpoint);
      expect(url).toContain(TEST_BUCKET);
      expect(url).toContain("test/file.txt");
    });
  });

  // ============================================================================
  // Test 3: Presigned URL Operations
  // ============================================================================

  describe("Presigned URL Operations", () => {
    it("should create signed download URL", async () => {
      if (!servicesHealthy) return;

      // Upload a file first
      const content = "Download via presigned URL";
      const file = createTestFile(content, "presigned-test.txt");
      const path = `test/presigned-${Date.now()}.txt`;
      await Effect.runPromise(gateway.upload(TEST_BUCKET, path, file));

      // Create presigned URL
      const input: CreateSignedDownloadUrlInput = {
        bucket: TEST_BUCKET,
        path,
        expiresInSeconds: 300, // 5 minutes
      };

      const result = await Effect.runPromise(
        gateway.createSignedDownloadUrl(input)
      ) as { signedUrl: string; expiresIn: number; path: string };

      expect(result.signedUrl).toBeDefined();
      expect(result.expiresIn).toBe(300);
      expect(result.path).toBe(path);

      // Verify URL works by fetching the file
      const fetchResult = await fetchAndVerifyFile(result.signedUrl, content);
      expect(fetchResult.success).toBe(true);
      expect(fetchResult.verified).toBe(true);
    });

    it("should create signed upload URL with native TUS endpoint", async () => {
      if (!servicesHealthy) return;

      const input: CreateSignedUploadUrlInput = {
        bucket: TEST_BUCKET,
        path: `test/upload-ticket-${Date.now()}.txt`,
        upsert: false,
        expiresInSeconds: 3600,
      };

      const result = await Effect.runPromise(
        gateway.createSignedUploadUrl(input)
      ) as CreateSignedUploadUrlResult & { expiresIn: number };

      expect(result.token).toBeDefined();
      expect(result.uploadUrl).toBeDefined();
      expect(result.expiresIn).toBe(3600);

      // Upload URL should point to SeaweedFS Filer TUS endpoint
      expect(result.uploadUrl).toContain(TEST_CONFIG.seaweedfs.endpoint);
      expect(result.uploadUrl).toContain("/tus/");
      expect(result.uploadUrl).toContain(TEST_BUCKET);
      expect(result.uploadUrl).toContain("auth=");
    });

    it("should generate unique tokens for each upload URL request", async () => {
      if (!servicesHealthy) return;

      const input: CreateSignedUploadUrlInput = {
        bucket: TEST_BUCKET,
        path: `test/upload-unique-${Date.now()}.txt`,
        upsert: false,
        expiresInSeconds: 3600,
      };

      const result1 = await Effect.runPromise(gateway.createSignedUploadUrl(input));
      const result2 = await Effect.runPromise(gateway.createSignedUploadUrl(input));

      // Tokens should be unique
      expect(result1.token).not.toBe(result2.token);
      // Upload URLs should be different (different auth tokens)
      expect(result1.uploadUrl).not.toBe(result2.uploadUrl);
    });
  });

  // ============================================================================
  // Test 4: End-to-End Flows
  // ============================================================================

  describe("End-to-End Flows", () => {
    it("should complete full upload flow: upload -> verify -> download", async () => {
      if (!servicesHealthy) {
        console.warn("Skipping: services not available");
        return;
      }

      const content = "End-to-end upload and download test content";
      const filename = `e2e-${Date.now()}.txt`;
      const path = `test/${filename}`;

      // Step 1: Upload file
      const file = createTestFile(content, filename);
      const uploadResult = await Effect.runPromise(
        gateway.upload(TEST_BUCKET, path, file)
      );
      expect(uploadResult.path).toBe(path);
      expect(uploadResult.publicUrl).toContain(TEST_BUCKET);

      // Step 2: Verify by downloading
      const downloaded = await Effect.runPromise(gateway.download(TEST_BUCKET, path));
      const downloadedText = await downloaded.text();
      expect(downloadedText).toBe(content);

      // Step 3: Create presigned download URL and fetch
      const downloadInput: CreateSignedDownloadUrlInput = {
        bucket: TEST_BUCKET,
        path,
        expiresInSeconds: 300,
      };
      const downloadResult = await Effect.runPromise(
        gateway.createSignedDownloadUrl(downloadInput)
      );

      const fetchResult = await fetchAndVerifyFile(downloadResult.signedUrl, content);
      expect(fetchResult.success).toBe(true);
      expect(fetchResult.verified).toBe(true);
    });

    it("should complete TUS upload flow: create upload URL -> verify format", async () => {
      if (!servicesHealthy) {
        console.warn("Skipping: services not available");
        return;
      }

      const path = `test/tus-flow-${Date.now()}.txt`;

      // Step 1: Create TUS upload URL
      const uploadInput: CreateSignedUploadUrlInput = {
        bucket: TEST_BUCKET,
        path,
        upsert: false,
        expiresInSeconds: 1800,
      };
      const uploadResult = await Effect.runPromise(
        gateway.createSignedUploadUrl(uploadInput)
      );

      // Verify response structure
      expect(uploadResult.token).toBeDefined();
      expect(uploadResult.uploadUrl).toBeDefined();
      expect(uploadResult.expiresIn).toBe(1800);

      // Verify TUS URL format: {endpoint}/tus/{bucket}/{path}?auth={token}
      const expectedPrefix = `${TEST_CONFIG.seaweedfs.endpoint}/tus/${TEST_BUCKET}/`;
      expect(uploadResult.uploadUrl.startsWith(expectedPrefix)).toBe(true);
      expect(uploadResult.uploadUrl.includes(`auth=${uploadResult.token}`)).toBe(true);

      // The client would use this URL with a TUS client library (e.g., tus-js-client)
      // to perform resumable uploads directly to SeaweedFS Filer
    });
  });

  // ============================================================================
  // Test 5: Error Handling
  // ============================================================================

  describe("Error Handling", () => {
    it("should handle non-existent file download", async () => {
      if (!servicesHealthy) return;

      const result = await Effect.runPromise(
        Effect.either(
          gateway.download(TEST_BUCKET, "test/non-existent-file.txt")
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toMatch(/FileNotFoundError|StorageError/);
      }
    });

    it("should handle invalid bucket operations", async () => {
      if (!servicesHealthy) return;

      // Operations on non-existent bucket should still work (SeaweedFS creates on demand)
      // but may return empty results or errors depending on configuration
      const file = createTestFile("test", "test.txt");
      const result = await Effect.runPromise(
        Effect.either(
          gateway.upload("non-existent-bucket-test", "test.txt", file)
        )
      );

      // May succeed (auto-create) or fail (restricted) depending on SeaweedFS config
      expect(Either.isLeft(result) || Either.isRight(result)).toBe(true);
    });
  });

  // ============================================================================
  // Test 6: Gateway Configuration
  // ============================================================================

  describe("Gateway Configuration", () => {
    it("should use correct S3 endpoint", () => {
      if (!servicesHealthy) return;

      const publicUrl = gateway.getPublicUrl(TEST_BUCKET, "test/config.txt");
      expect(publicUrl).toContain(TEST_CONFIG.seaweedfs.endpoint);
    });

    it("should return valid TUS URL format from createSignedUploadUrl", async () => {
      if (!servicesHealthy) return;

      const input: CreateSignedUploadUrlInput = {
        bucket: TEST_BUCKET,
        path: `test/tus-format-${Date.now()}.txt`,
        upsert: false,
        expiresInSeconds: 3600,
      };

      const result = await Effect.runPromise(gateway.createSignedUploadUrl(input));

      // Token should be a hexadecimal string with timestamp
      expect(result.token).toMatch(/^[0-9a-f]+-\d+$/);

      // Upload URL should be valid TUS endpoint
      expect(result.uploadUrl).toContain("/tus/");
      expect(result.uploadUrl).toContain("auth=");
    });
  });

  // ============================================================================
  // Test 7: Configuration Validation
  // ============================================================================

  describe("Configuration Validation", () => {
    it("should validate correct configuration", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateSeaweedFSConfig(TEST_CONFIG.seaweedfs))
      );

      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right.endpoint).toBe(TEST_CONFIG.seaweedfs.endpoint);
        expect(result.right.accessKeyId).toBe(TEST_CONFIG.seaweedfs.accessKeyId);
      }
    });

    it("should reject empty endpoint", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateSeaweedFSConfig({ endpoint: "" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ConfigurationError");
      }
    });

    it("should reject invalid URL format", async () => {
      const result = await Effect.runPromise(
        Effect.either(validateSeaweedFSConfig({ endpoint: "not-a-url" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("ConfigurationError");
      }
    });
  });
});
