import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryAuthAdapter } from "../auth/InMemoryAuthAdapter";
import { InMemoryRealtimeAdapter } from "../realtime/InMemoryRealtimeAdapter";
import { InMemoryStorageAdapter } from "../storage/InMemoryStorageAdapter";
import {
  AuthError,
  InvalidTokenError,
  SessionExpiredError,
} from "@mirai-app/use-cases/ports/AuthPort";
import {
  RealtimeError,
  SubscriptionError,
} from "@mirai-app/use-cases/ports/RealtimePort";
import {
  StorageError,
  FileNotFoundError,
  UploadError,
} from "@mirai-app/use-cases/ports/StoragePort";
import { AuthContext, UserRole, isOk, isErr, UserId } from "@mirai-app/domain";

describe("[CONTRACT] InMemory Adapters", () => {
  // =============================================================================
  // AuthPort Contract Tests (via InMemoryAuthAdapter)
  // =============================================================================

  describe("AuthPort - InMemoryAuthAdapter", () => {
    let adapter: InMemoryAuthAdapter;

    beforeEach(() => {
      adapter = new InMemoryAuthAdapter();
    });

    describe("validateToken", () => {
      it("should return Result type on success", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeInstanceOf(AuthContext);
        }
      });

      it("should return Result type on error", async () => {
        const result = await adapter.validateToken("invalid-token");

        expect(result).toHaveProperty("kind");
        expect(isErr(result)).toBe(true);
      });

      it("should return InvalidTokenError for unknown token", async () => {
        const result = await adapter.validateToken("unknown-token");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(InvalidTokenError);
          expect(result.error._tag).toBe("InvalidTokenError");
          expect(result.error.code).toBe("INVALID_TOKEN");
        }
      });

      it("should return SessionExpiredError for expired session", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440002");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId, -1); // Expired

        const result = await adapter.validateToken(session.token);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(SessionExpiredError);
          expect(result.error._tag).toBe("SessionExpiredError");
          expect(result.error.code).toBe("SESSION_EXPIRED");
          expect(result.error.sessionId).toBe(session.sessionId);
          expect(result.error.expiredAt).toBeInstanceOf(Date);
        }
      });

      it("should return InvalidTokenError for empty token", async () => {
        const result = await adapter.validateToken("");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(InvalidTokenError);
          expect(result.error.message).toBe("Token cannot be empty");
        }
      });

      it("should include userId and role in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440003");
        adapter.createUser({ id: userId, role: UserRole.ADMIN });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(UserId.toString(result.value.userId)).toBe(
            "550e8400-e29b-41d4-a716-446655440003",
          );
          expect(result.value.role).toBe(UserRole.ADMIN);
          expect(result.value.isAdmin()).toBe(true);
        }
      });

      it("should include sessionId in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440004");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.sessionId).toBe(session.sessionId);
        }
      });

      it("should handle AuthError for unexpected failures", async () => {
        // Create a scenario that triggers an AuthError by corrupting internal state
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440005");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        // Delete the session but keep token mapping to trigger internal error
        (adapter as any).sessions.delete(session.sessionId);

        const result = await adapter.validateToken(session.token);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          // Should be one of the error types
          expect(
            result.error instanceof InvalidTokenError ||
              result.error instanceof AuthError,
          ).toBe(true);
        }
      });
    });

    describe("refreshSession", () => {
      it("should return Result type on success", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440006");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
      });

      it("should return Result type on error", async () => {
        const result = await adapter.refreshSession("non-existent-session");

        expect(result).toHaveProperty("kind");
        expect(isErr(result)).toBe(true);
      });

      it("should return SessionExpiredError for missing session", async () => {
        const result = await adapter.refreshSession("missing-session-id");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(SessionExpiredError);
          expect(result.error._tag).toBe("SessionExpiredError");
          expect(result.error.code).toBe("SESSION_EXPIRED");
          expect(result.error.sessionId).toBe("missing-session-id");
        }
      });

      it("should return SessionExpiredError for expired session", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440007");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId, -1); // Expired

        const result = await adapter.refreshSession(session.sessionId);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(SessionExpiredError);
          expect(result.error.expiredAt).toBeInstanceOf(Date);
        }
      });

      it("should maintain session ID after refresh", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440008");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.sessionId).toBe(session.sessionId);
        }
      });

      it("should preserve user role in refreshed context", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440009");
        adapter.createUser({ id: userId, role: UserRole.MODERATOR });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.role).toBe(UserRole.MODERATOR);
          expect(result.value.isModerator()).toBe(true);
          expect(result.value.isAdmin()).toBe(false);
        }
      });
    });
  });

  // =============================================================================
  // RealtimePort Contract Tests (via InMemoryRealtimeAdapter)
  // =============================================================================

  describe("RealtimePort - InMemoryRealtimeAdapter", () => {
    let adapter: InMemoryRealtimeAdapter;

    beforeEach(() => {
      adapter = new InMemoryRealtimeAdapter();
    });

    describe("subscribe", () => {
      it("should return Result<RealtimeSubscription, RealtimeError | SubscriptionError>", () => {
        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("id");
          expect(result.value).toHaveProperty("channel");
          expect(result.value).toHaveProperty("state");
          expect(result.value).toHaveProperty("unsubscribe");
        }
      });

      it("should return SubscriptionError when adapter is closed", () => {
        adapter.setConnectionState("CLOSED");

        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(SubscriptionError);
          expect(result.error._tag).toBe("SubscriptionError");
          expect(result.error.code).toBe("SUBSCRIPTION_ERROR");
          expect(result.error.channel).toBe("test-channel");
        }
      });

      it("should have CONNECTED state after successful subscribe", () => {
        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.state).toBe("CONNECTED");
        }
      });

      it("should return unique subscription IDs", () => {
        const result1 = adapter.subscribe("channel-1", { onMessage: () => {} });
        const result2 = adapter.subscribe("channel-2", { onMessage: () => {} });

        expect(isOk(result1)).toBe(true);
        expect(isOk(result2)).toBe(true);
        if (isOk(result1) && isOk(result2)) {
          expect(result1.value.id).not.toBe(result2.value.id);
        }
      });

      it("should store channel name in subscription", () => {
        const result = adapter.subscribe("my-channel", {
          onMessage: () => {},
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.channel).toBe("my-channel");
        }
      });
    });

    describe("broadcast", () => {
      it("should return Result<void, RealtimeError>", async () => {
        const result = await adapter.broadcast("test-channel", "event", {
          data: "value",
        });

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeUndefined();
        }
      });

      it("should deliver messages to subscribers", async () => {
        const receivedMessages: { event: string; payload: unknown }[] = [];

        adapter.subscribe("broadcast-channel", {
          onMessage: (event, payload) => {
            receivedMessages.push({ event, payload });
          },
        });

        await adapter.broadcast("broadcast-channel", "test-event", {
          key: "value",
        });

        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0].event).toBe("test-event");
        expect(receivedMessages[0].payload).toEqual({ key: "value" });
      });

      it("should not fail when broadcasting to channel with no subscribers", async () => {
        const result = await adapter.broadcast("empty-channel", "event", {});

        expect(isOk(result)).toBe(true);
      });

      it("should deliver only to correct channel subscribers", async () => {
        const channel1Messages: string[] = [];
        const channel2Messages: string[] = [];

        adapter.subscribe("channel-1", {
          onMessage: () => channel1Messages.push("received"),
        });

        adapter.subscribe("channel-2", {
          onMessage: () => channel2Messages.push("received"),
        });

        await adapter.broadcast("channel-1", "event", {});

        expect(channel1Messages).toHaveLength(1);
        expect(channel2Messages).toHaveLength(0);
      });

      it("should filter messages by event type when configured", async () => {
        const allowedEvents: string[] = [];
        const allEvents: string[] = [];

        adapter.subscribe("filtered-channel", {
          events: ["allowed-event"],
          onMessage: (event) => allowedEvents.push(event),
        });

        adapter.subscribe("filtered-channel", {
          onMessage: (event) => allEvents.push(event),
        });

        await adapter.broadcast("filtered-channel", "allowed-event", {});
        await adapter.broadcast("filtered-channel", "blocked-event", {});

        expect(allowedEvents).toHaveLength(1);
        expect(allowedEvents[0]).toBe("allowed-event");
        expect(allEvents).toHaveLength(2); // No filter, receives all
      });

      it("should isolate errors in message handlers", async () => {
        const receivedMessages: string[] = [];

        adapter.subscribe("error-channel", {
          onMessage: () => {
            throw new Error("Handler error");
          },
        });

        adapter.subscribe("error-channel", {
          onMessage: () => receivedMessages.push("received"),
        });

        // Should not throw
        const result = await adapter.broadcast("error-channel", "event", {});

        expect(isOk(result)).toBe(true);
        expect(receivedMessages).toHaveLength(1);
      });
    });

    describe("trackPresence", () => {
      it("should return Result<void, RealtimeError>", async () => {
        const result = await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "online" },
        });

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
      });

      it("should store presence data for retrieval", async () => {
        await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "online", activity: "browsing" },
        });

        const presenceData = adapter.getPresenceData("presence-channel");

        expect(presenceData).toBeDefined();
        expect(presenceData!.get("user-1")).toBeDefined();
        expect(presenceData!.get("user-1")!.userId).toBe("user-1");
        expect(presenceData!.get("user-1")!.payload).toEqual({
          status: "online",
          activity: "browsing",
        });
      });

      it("should update presence for existing user", async () => {
        await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "online" },
        });

        await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "away" },
        });

        const presenceData = adapter.getPresenceData("presence-channel");
        expect(presenceData!.get("user-1")!.payload).toEqual({
          status: "away",
        });
      });

      it("should track multiple users in same channel", async () => {
        await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "online" },
        });

        await adapter.trackPresence("presence-channel", {
          userId: "user-2",
          payload: { status: "online" },
        });

        await adapter.trackPresence("presence-channel", {
          userId: "user-3",
          payload: { status: "away" },
        });

        const presenceData = adapter.getPresenceData("presence-channel");
        expect(presenceData!.size).toBe(3);
      });
    });

    describe("getConnectionState", () => {
      it("should return ConnectionState type", () => {
        const state = adapter.getConnectionState();

        expect(["CONNECTED", "CLOSED", "CONNECTING", "DISCONNECTED"]).toContain(
          state,
        );
      });

      it("should return CONNECTED by default", () => {
        expect(adapter.getConnectionState()).toBe("CONNECTED");
      });

      it("should reflect state changes", () => {
        adapter.setConnectionState("CLOSED");
        expect(adapter.getConnectionState()).toBe("CLOSED");

        adapter.setConnectionState("CONNECTED");
        expect(adapter.getConnectionState()).toBe("CONNECTED");
      });
    });

    describe("unsubscribe", () => {
      it("should return Result<void, RealtimeError>", () => {
        const subResult = adapter.subscribe("unsub-channel", {
          onMessage: () => {},
        });

        expect(isOk(subResult)).toBe(true);
        if (isOk(subResult)) {
          const unsubResult = subResult.value.unsubscribe();
          expect(unsubResult).toHaveProperty("kind");
          expect(isOk(unsubResult)).toBe(true);
        }
      });

      it("should stop receiving messages after unsubscribe", async () => {
        const receivedMessages: string[] = [];

        const subResult = adapter.subscribe("unsub-test", {
          onMessage: () => receivedMessages.push("received"),
        });

        expect(isOk(subResult)).toBe(true);
        if (isOk(subResult)) {
          // Receive first message
          await adapter.broadcast("unsub-test", "event", {});
          expect(receivedMessages).toHaveLength(1);

          // Unsubscribe
          subResult.value.unsubscribe();

          // Should not receive more
          await adapter.broadcast("unsub-test", "event", {});
          expect(receivedMessages).toHaveLength(1);
        }
      });

      it("should have CLOSED state after unsubscribe", () => {
        const subResult = adapter.subscribe("unsub-state", {
          onMessage: () => {},
        });

        expect(isOk(subResult)).toBe(true);
        if (isOk(subResult)) {
          expect(subResult.value.state).toBe("CONNECTED");
          subResult.value.unsubscribe();
          expect(subResult.value.state).toBe("CLOSED");
        }
      });
    });
  });

  // =============================================================================
  // StoragePort Contract Tests (via InMemoryStorageAdapter)
  // =============================================================================

  describe("StoragePort - InMemoryStorageAdapter", () => {
    let adapter: InMemoryStorageAdapter;

    beforeEach(() => {
      adapter = new InMemoryStorageAdapter();
    });

    describe("upload", () => {
      it("should return Result<FileMetadata, StorageError | UploadError>", async () => {
        const buffer = Buffer.from("test content");
        const result = await adapter.upload("test-bucket", "test.txt", buffer);

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("path");
          expect(result.value).toHaveProperty("bucket");
          expect(result.value).toHaveProperty("size");
          expect(result.value).toHaveProperty("contentType");
          expect(result.value).toHaveProperty("createdAt");
          expect(result.value).toHaveProperty("updatedAt");
        }
      });

      it("should store file for later retrieval", async () => {
        const content = "Hello, World!";
        const buffer = Buffer.from(content);

        const uploadResult = await adapter.upload(
          "files-bucket",
          "hello.txt",
          buffer,
        );

        expect(isOk(uploadResult)).toBe(true);
        expect(adapter.fileExists("files-bucket", "hello.txt")).toBe(true);
      });

      it("should return UploadError when file exists and upsert is false", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.upload("bucket", "file.txt", buffer, {
          upsert: false,
        });

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(UploadError);
          expect(result.error._tag).toBe("UploadError");
          expect(result.error.code).toBe("UPLOAD_ERROR");
          expect(result.error.bucket).toBe("bucket");
          expect(result.error.path).toBe("file.txt");
        }
      });

      it("should overwrite when upsert is true", async () => {
        const buffer1 = Buffer.from("original content");
        const buffer2 = Buffer.from("updated content");

        await adapter.upload("bucket", "file.txt", buffer1);
        const result = await adapter.upload("bucket", "file.txt", buffer2, {
          upsert: true,
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.size).toBe(buffer2.length);
        }
      });

      it("should auto-detect content type from extension", async () => {
        const buffer = Buffer.from("image data");
        const result = await adapter.upload("bucket", "image.png", buffer);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.contentType).toBe("image/png");
        }
      });

      it("should accept custom content type", async () => {
        const buffer = Buffer.from("data");
        const result = await adapter.upload("bucket", "file.bin", buffer, {
          contentType: "application/octet-stream",
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.contentType).toBe("application/octet-stream");
        }
      });

      it("should handle Blob input", async () => {
        const blob = new Blob(["blob content"], { type: "text/plain" });
        const result = await adapter.upload("bucket", "blob.txt", blob);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.size).toBe(12); // "blob content"
        }
      });
    });

    describe("download", () => {
      it("should return Result<Buffer | Blob, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.download("bucket", "file.txt");

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeInstanceOf(Buffer);
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await adapter.download("bucket", "missing.txt");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(FileNotFoundError);
          expect(result.error._tag).toBe("FileNotFoundError");
          expect(result.error.code).toBe("FILE_NOT_FOUND");
          expect(result.error.bucket).toBe("bucket");
          expect(result.error.path).toBe("missing.txt");
        }
      });

      it("should return correct file content", async () => {
        const content = "test file content";
        const buffer = Buffer.from(content);
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.download("bucket", "file.txt");

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.toString()).toBe(content);
        }
      });

      it("should return independent buffer copy", async () => {
        const buffer = Buffer.from("original");
        await adapter.upload("bucket", "file.txt", buffer);

        const result1 = await adapter.download("bucket", "file.txt");
        const result2 = await adapter.download("bucket", "file.txt");

        expect(isOk(result1) && isOk(result2)).toBe(true);
        if (isOk(result1) && isOk(result2)) {
          expect(result1.value).not.toBe(result2.value); // Different instances
          expect(result1.value.toString()).toBe(result2.value.toString()); // Same content
        }
      });
    });

    describe("delete", () => {
      it("should return Result<void, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.delete("bucket", ["file.txt"]);

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
      });

      it("should remove file from storage", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);
        expect(adapter.fileExists("bucket", "file.txt")).toBe(true);

        await adapter.delete("bucket", ["file.txt"]);

        expect(adapter.fileExists("bucket", "file.txt")).toBe(false);
      });

      it("should return FileNotFoundError for non-existent files", async () => {
        const result = await adapter.delete("bucket", ["missing.txt"]);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(FileNotFoundError);
        }
      });

      it("should delete multiple files", async () => {
        await adapter.upload("bucket", "file1.txt", Buffer.from("1"));
        await adapter.upload("bucket", "file2.txt", Buffer.from("2"));
        await adapter.upload("bucket", "file3.txt", Buffer.from("3"));

        const result = await adapter.delete("bucket", [
          "file1.txt",
          "file2.txt",
        ]);

        expect(isOk(result)).toBe(true);
        expect(adapter.fileExists("bucket", "file1.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file2.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file3.txt")).toBe(true);
      });

      it("should partially fail if some files don't exist", async () => {
        await adapter.upload("bucket", "file1.txt", Buffer.from("1"));

        const result = await adapter.delete("bucket", [
          "file1.txt",
          "missing.txt",
        ]);

        expect(isErr(result)).toBe(true);
        // file1.txt should still be deleted (operation attempted)
        expect(adapter.fileExists("bucket", "file1.txt")).toBe(false);
      });
    });

    describe("createSignedUrl", () => {
      it("should return Result<SignedUrlInfo, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );

        expect(result).toHaveProperty("kind");
        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("url");
          expect(result.value).toHaveProperty("expiresAt");
          expect(result.value).toHaveProperty("expiresInSeconds");
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await adapter.createSignedUrl(
          "bucket",
          "missing.txt",
          3600,
        );

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toBeInstanceOf(FileNotFoundError);
        }
      });

      it("should generate valid URL with expiration", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.url).toContain("inmemory://");
          expect(result.value.url).toContain("bucket/file.txt");
          expect(result.value.expiresInSeconds).toBe(3600);
          expect(result.value.expiresAt).toBeInstanceOf(Date);
          expect(result.value.expiresAt.getTime()).toBeGreaterThan(Date.now());
        }
      });

      it("should validate signed URL", async () => {
        const buffer = Buffer.from("content");
        await adapter.upload("bucket", "file.txt", buffer);

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          const validatedInfo = adapter.validateSignedUrl(result.value.url);
          expect(validatedInfo).toBeDefined();
          expect(validatedInfo!.expiresInSeconds).toBe(3600);
        }
      });
    });

    describe("adapter-specific helper methods", () => {
      it("should track file metadata", async () => {
        const buffer = Buffer.from("test content");
        await adapter.upload("bucket", "file.txt", buffer, {
          contentType: "text/plain",
        });

        const metadata = adapter.getFileMetadata("bucket", "file.txt");

        expect(metadata).toBeDefined();
        expect(metadata!.size).toBe(buffer.length);
        expect(metadata!.contentType).toBe("text/plain");
        expect(metadata!.bucket).toBe("bucket");
        expect(metadata!.path).toBe("bucket/file.txt");
      });

      it("should list files in bucket", async () => {
        await adapter.upload("bucket1", "file1.txt", Buffer.from("1"));
        await adapter.upload("bucket1", "file2.txt", Buffer.from("2"));
        await adapter.upload("bucket2", "file3.txt", Buffer.from("3"));

        const bucket1Files = adapter.listFiles("bucket1");
        const bucket2Files = adapter.listFiles("bucket2");

        expect(bucket1Files).toHaveLength(2);
        expect(bucket2Files).toHaveLength(1);
      });

      it("should calculate total storage size", async () => {
        await adapter.upload("bucket", "file1.txt", Buffer.from("12345"));
        await adapter.upload("bucket", "file2.txt", Buffer.from("67890"));

        const totalSize = adapter.getTotalSize();

        expect(totalSize).toBe(10); // 5 + 5
      });

      it("should clear all files", async () => {
        await adapter.upload("bucket", "file1.txt", Buffer.from("1"));
        await adapter.upload("bucket", "file2.txt", Buffer.from("2"));

        adapter.clear();

        expect(adapter.fileExists("bucket", "file1.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file2.txt")).toBe(false);
        expect(adapter.listFiles("bucket")).toHaveLength(0);
        expect(adapter.getTotalSize()).toBe(0);
      });
    });
  });
});
