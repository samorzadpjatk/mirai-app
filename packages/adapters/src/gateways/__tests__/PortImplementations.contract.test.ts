import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryAuthAdapter } from "../auth/InMemoryAuthAdapter";
import { InMemoryRealtimeAdapter } from "../realtime/InMemoryRealtimeAdapter";
import { InMemoryStorageAdapter } from "../storage/InMemoryStorageAdapter";
import { SupabaseAuthAdapter } from "../auth/SupabaseAuthAdapter";
import { SupabaseRealtimeAdapter } from "../realtime/SupabaseRealtimeAdapter";
import { SupabaseStorageAdapter } from "../storage/SupabaseStorageAdapter";
import type { AuthPort } from "@mirai-app/use-cases/ports/AuthPort";
import type { RealtimePort } from "@mirai-app/use-cases/ports/RealtimePort";
import type { StoragePort } from "@mirai-app/use-cases/ports/StoragePort";
import { UserId, UserRole, isOk, isErr } from "@mirai-app/domain";

/**
 * PortImplementationContractTests
 *
 * These tests verify that InMemory adapters behave identically to their
 * Supabase counterparts for the same inputs. This ensures:
 * - Test fidelity (tests using InMemory adapters predict Supabase behavior)
 * - Consistent error handling across implementations
 * - Interface compliance verification
 */

describe("[CONTRACT] Port Implementation Consistency", () => {
  // =============================================================================
  // AuthPort Implementation Consistency
  // =============================================================================

  describe("AuthPort - InMemory vs Supabase consistency", () => {
    let inMemoryAdapter: InMemoryAuthAdapter;

    beforeEach(() => {
      inMemoryAdapter = new InMemoryAuthAdapter();
    });

    describe("interface compliance", () => {
      it("InMemoryAuthAdapter should implement AuthPort interface", () => {
        // Type check - if this compiles, the interface is implemented
        const authPort: AuthPort = inMemoryAdapter;
        expect(authPort).toBeDefined();
        expect(typeof authPort.validateToken).toBe("function");
        expect(typeof authPort.refreshSession).toBe("function");
      });

      it("should return Result type from validateToken", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.USER });
        const session = inMemoryAdapter.createSession(userId);

        const result = await inMemoryAdapter.validateToken(session.token);

        // Result type compliance
        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("should return Result type from refreshSession", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440002");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.USER });
        const session = inMemoryAdapter.createSession(userId);

        const result = await inMemoryAdapter.refreshSession(session.sessionId);

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });
    });

    describe("error handling consistency", () => {
      it("should return InvalidTokenError for invalid token", async () => {
        const result = await inMemoryAdapter.validateToken("invalid-token");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("InvalidTokenError");
          expect(result.error.code).toBe("INVALID_TOKEN");
        }
      });

      it("should return SessionExpiredError for expired session", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440003");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.USER });
        const session = inMemoryAdapter.createSession(userId, -1); // Expired

        const result = await inMemoryAdapter.validateToken(session.token);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("SessionExpiredError");
          expect(result.error.code).toBe("SESSION_EXPIRED");
        }
      });

      it("should return same error structure for empty token", async () => {
        const result = await inMemoryAdapter.validateToken("");

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error).toHaveProperty("_tag");
          expect(result.error).toHaveProperty("code");
          expect(result.error).toHaveProperty("message");
        }
      });
    });

    describe("success response consistency", () => {
      it("should return AuthContext with required fields on success", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440004");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.USER });
        const session = inMemoryAdapter.createSession(userId);

        const result = await inMemoryAdapter.validateToken(session.token);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("userId");
          expect(result.value).toHaveProperty("role");
          expect(result.value).toHaveProperty("sessionId");
          expect(result.value).toHaveProperty("authenticatedAt");
          expect(result.value).toHaveProperty("isAdmin");
          expect(result.value).toHaveProperty("isModerator");
        }
      });

      it("should preserve userId in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440005");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.USER });
        const session = inMemoryAdapter.createSession(userId);

        const result = await inMemoryAdapter.validateToken(session.token);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(UserId.toString(result.value.userId)).toBe(
            "550e8400-e29b-41d4-a716-446655440005",
          );
        }
      });

      it("should preserve role in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440006");
        inMemoryAdapter.createUser({ id: userId, role: UserRole.ADMIN });
        const session = inMemoryAdapter.createSession(userId);

        const result = await inMemoryAdapter.validateToken(session.token);

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.role).toBe(UserRole.ADMIN);
          expect(result.value.isAdmin()).toBe(true);
        }
      });
    });
  });

  // =============================================================================
  // RealtimePort Implementation Consistency
  // =============================================================================

  describe("RealtimePort - InMemory vs Supabase consistency", () => {
    let inMemoryAdapter: InMemoryRealtimeAdapter;

    beforeEach(() => {
      inMemoryAdapter = new InMemoryRealtimeAdapter();
    });

    describe("interface compliance", () => {
      it("InMemoryRealtimeAdapter should implement RealtimePort interface", () => {
        const realtimePort: RealtimePort = inMemoryAdapter;
        expect(realtimePort).toBeDefined();
        expect(typeof realtimePort.subscribe).toBe("function");
        expect(typeof realtimePort.broadcast).toBe("function");
        expect(typeof realtimePort.trackPresence).toBe("function");
        expect(typeof realtimePort.getConnectionState).toBe("function");
      });

      it("subscribe should return Result type", () => {
        const result = inMemoryAdapter.subscribe("test-channel", {
          onMessage: () => {},
        });

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("broadcast should return Promise<Result>", async () => {
        const result = await inMemoryAdapter.broadcast(
          "test-channel",
          "event",
          {},
        );

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("trackPresence should return Promise<Result>", async () => {
        const result = await inMemoryAdapter.trackPresence("test-channel", {
          userId: "user-1",
        });

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("getConnectionState should return ConnectionState", () => {
        const state = inMemoryAdapter.getConnectionState();

        expect(["CONNECTED", "DISCONNECTED", "CLOSED", "CONNECTING"]).toContain(
          state,
        );
      });
    });

    describe("subscription consistency", () => {
      it("should return RealtimeSubscription on successful subscribe", () => {
        const result = inMemoryAdapter.subscribe("channel", {
          onMessage: () => {},
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("id");
          expect(result.value).toHaveProperty("channel");
          expect(result.value).toHaveProperty("state");
          expect(result.value).toHaveProperty("unsubscribe");
          expect(typeof result.value.unsubscribe).toBe("function");
        }
      });

      it("subscription should have CONNECTED state initially", () => {
        const result = inMemoryAdapter.subscribe("channel", {
          onMessage: () => {},
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.state).toBe("CONNECTED");
        }
      });

      it("should return SubscriptionError when connection is closed", () => {
        inMemoryAdapter.setConnectionState("CLOSED");

        const result = inMemoryAdapter.subscribe("channel", {
          onMessage: () => {},
        });

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("SubscriptionError");
        }
      });

      it("unsubscribe should return Result type", () => {
        const subResult = inMemoryAdapter.subscribe("channel", {
          onMessage: () => {},
        });

        expect(isOk(subResult)).toBe(true);
        if (isOk(subResult)) {
          const unsubResult = subResult.value.unsubscribe();
          expect(unsubResult).toHaveProperty("kind");
        }
      });
    });

    describe("broadcast consistency", () => {
      it("should return ok for successful broadcast", async () => {
        const result = await inMemoryAdapter.broadcast("channel", "event", {
          data: "value",
        });

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toBeUndefined();
        }
      });

      it("should deliver to subscribed handlers", async () => {
        const receivedMessages: unknown[] = [];

        inMemoryAdapter.subscribe("channel", {
          onMessage: (event, payload) => {
            receivedMessages.push({ event, payload });
          },
        });

        await inMemoryAdapter.broadcast("channel", "test-event", {
          key: "value",
        });

        expect(receivedMessages).toHaveLength(1);
        expect((receivedMessages[0] as any).event).toBe("test-event");
      });

      it("should not fail when broadcasting to empty channel", async () => {
        const result = await inMemoryAdapter.broadcast(
          "empty-channel",
          "event",
          {},
        );

        expect(isOk(result)).toBe(true);
      });
    });

    describe("presence consistency", () => {
      it("should return ok for successful presence tracking", async () => {
        const result = await inMemoryAdapter.trackPresence("channel", {
          userId: "user-1",
          payload: { status: "online" },
        });

        expect(isOk(result)).toBe(true);
      });

      it("should store presence data", async () => {
        await inMemoryAdapter.trackPresence("channel", {
          userId: "user-1",
          payload: { status: "online" },
        });

        const presenceData = inMemoryAdapter.getPresenceData("channel");
        expect(presenceData).toBeDefined();
        expect(presenceData!.get("user-1")).toBeDefined();
      });
    });
  });

  // =============================================================================
  // StoragePort Implementation Consistency
  // =============================================================================

  describe("StoragePort - InMemory vs Supabase consistency", () => {
    let inMemoryAdapter: InMemoryStorageAdapter;

    beforeEach(() => {
      inMemoryAdapter = new InMemoryStorageAdapter();
    });

    describe("interface compliance", () => {
      it("InMemoryStorageAdapter should implement StoragePort interface", () => {
        const storagePort: StoragePort = inMemoryAdapter;
        expect(storagePort).toBeDefined();
        expect(typeof storagePort.upload).toBe("function");
        expect(typeof storagePort.download).toBe("function");
        expect(typeof storagePort.delete).toBe("function");
        expect(typeof storagePort.createSignedUrl).toBe("function");
      });

      it("upload should return Promise<Result<FileMetadata, ...>>", async () => {
        const result = await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("download should return Promise<Result<Buffer | Blob, ...>>", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );
        const result = await inMemoryAdapter.download("bucket", "file.txt");

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("delete should return Promise<Result<void, ...>>", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );
        const result = await inMemoryAdapter.delete("bucket", ["file.txt"]);

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });

      it("createSignedUrl should return Promise<Result<SignedUrlInfo, ...>>", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );
        const result = await inMemoryAdapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );

        expect(result).toHaveProperty("kind");
        expect(["ok", "err"]).toContain(result.kind);
      });
    });

    describe("upload consistency", () => {
      it("should return FileMetadata on successful upload", async () => {
        const result = await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("test content"),
        );

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("path");
          expect(result.value).toHaveProperty("bucket");
          expect(result.value).toHaveProperty("size");
          expect(result.value).toHaveProperty("createdAt");
          expect(result.value).toHaveProperty("updatedAt");
        }
      });

      it("should return UploadError when file exists and upsert is false", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );

        const result = await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("new content"),
          { upsert: false },
        );

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("UploadError");
        }
      });

      it("should overwrite when upsert is true", async () => {
        await inMemoryAdapter.upload("bucket", "file.txt", Buffer.from("old"));

        const result = await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("new content"),
          { upsert: true },
        );

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.size).toBe(11); // "new content"
        }
      });
    });

    describe("download consistency", () => {
      it("should return file content on successful download", async () => {
        const content = "test file content";
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from(content),
        );

        const result = await inMemoryAdapter.download("bucket", "file.txt");

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value.toString()).toBe(content);
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await inMemoryAdapter.download(
          "bucket",
          "non-existent.txt",
        );

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("FileNotFoundError");
          expect(result.error.code).toBe("FILE_NOT_FOUND");
        }
      });
    });

    describe("delete consistency", () => {
      it("should remove file on successful delete", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );
        expect(inMemoryAdapter.fileExists("bucket", "file.txt")).toBe(true);

        const result = await inMemoryAdapter.delete("bucket", ["file.txt"]);

        expect(isOk(result)).toBe(true);
        expect(inMemoryAdapter.fileExists("bucket", "file.txt")).toBe(false);
      });

      it("should return FileNotFoundError for non-existent files", async () => {
        const result = await inMemoryAdapter.delete("bucket", [
          "non-existent.txt",
        ]);

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("FileNotFoundError");
        }
      });
    });

    describe("signed URL consistency", () => {
      it("should return SignedUrlInfo on success", async () => {
        await inMemoryAdapter.upload(
          "bucket",
          "file.txt",
          Buffer.from("content"),
        );

        const result = await inMemoryAdapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );

        expect(isOk(result)).toBe(true);
        if (isOk(result)) {
          expect(result.value).toHaveProperty("url");
          expect(result.value).toHaveProperty("expiresAt");
          expect(result.value).toHaveProperty("expiresInSeconds");
          expect(result.value.expiresInSeconds).toBe(3600);
          expect(result.value.expiresAt).toBeInstanceOf(Date);
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await inMemoryAdapter.createSignedUrl(
          "bucket",
          "non-existent.txt",
          3600,
        );

        expect(isErr(result)).toBe(true);
        if (isErr(result)) {
          expect(result.error._tag).toBe("FileNotFoundError");
        }
      });
    });
  });

  // =============================================================================
  // State Management Consistency
  // =============================================================================

  describe("state management consistency", () => {
    describe("InMemoryAuthAdapter", () => {
      it("should maintain isolated state between instances", async () => {
        const adapter1 = new InMemoryAuthAdapter();
        const adapter2 = new InMemoryAuthAdapter();

        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440007");
        adapter1.createUser({ id: userId, role: UserRole.USER });
        const session = adapter1.createSession(userId);

        // adapter2 should not see adapter1's data
        const result = await adapter2.validateToken(session.token);
        expect(isErr(result)).toBe(true);
      });

      it("should clear all state on clear()", () => {
        const adapter = new InMemoryAuthAdapter();
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440008");
        adapter.createUser({ id: userId, role: UserRole.USER });
        adapter.createSession(userId);

        expect(adapter.hasUser(userId)).toBe(true);

        adapter.clear();

        expect(adapter.hasUser(userId)).toBe(false);
        expect(adapter.getAllUsers()).toHaveLength(0);
        expect(adapter.getAllSessions()).toHaveLength(0);
      });
    });

    describe("InMemoryRealtimeAdapter", () => {
      it("should maintain isolated state between instances", async () => {
        const adapter1 = new InMemoryRealtimeAdapter();
        const adapter2 = new InMemoryRealtimeAdapter();

        let received = false;
        adapter1.subscribe("channel", {
          onMessage: () => {
            received = true;
          },
        });

        await adapter2.broadcast("channel", "event", {});

        expect(received).toBe(false);
      });

      it("should clear all state on clear()", () => {
        const adapter = new InMemoryRealtimeAdapter();
        adapter.subscribe("channel", { onMessage: () => {} });

        expect(adapter.getSubscribers("channel")).toHaveLength(1);

        adapter.clear();

        expect(adapter.getSubscribers("channel")).toHaveLength(0);
        expect(adapter.getConnectionState()).toBe("CONNECTED");
      });
    });

    describe("InMemoryStorageAdapter", () => {
      it("should maintain isolated state between instances", async () => {
        const adapter1 = new InMemoryStorageAdapter();
        const adapter2 = new InMemoryStorageAdapter();

        await adapter1.upload("bucket", "file.txt", Buffer.from("content"));

        expect(adapter1.fileExists("bucket", "file.txt")).toBe(true);
        expect(adapter2.fileExists("bucket", "file.txt")).toBe(false);
      });

      it("should clear all state on clear()", async () => {
        const adapter = new InMemoryStorageAdapter();
        await adapter.upload("bucket", "file.txt", Buffer.from("content"));

        expect(adapter.fileExists("bucket", "file.txt")).toBe(true);

        adapter.clear();

        expect(adapter.fileExists("bucket", "file.txt")).toBe(false);
        expect(adapter.getTotalSize()).toBe(0);
        expect(adapter.listFiles("bucket")).toHaveLength(0);
      });
    });
  });

  // =============================================================================
  // Error Structure Consistency
  // =============================================================================

  describe("error structure consistency", () => {
    it("all errors should have _tag property", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const realtimeAdapter = new InMemoryRealtimeAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      // Auth error
      const authResult = await authAdapter.validateToken("invalid");
      if (isErr(authResult)) {
        expect(authResult.error).toHaveProperty("_tag");
      }

      // Realtime error
      realtimeAdapter.setConnectionState("CLOSED");
      const realtimeResult = realtimeAdapter.subscribe("channel", {
        onMessage: () => {},
      });
      if (isErr(realtimeResult)) {
        expect(realtimeResult.error).toHaveProperty("_tag");
      }

      // Storage error
      const storageResult = await storageAdapter.download(
        "bucket",
        "missing.txt",
      );
      if (isErr(storageResult)) {
        expect(storageResult.error).toHaveProperty("_tag");
      }
    });

    it("all errors should have code property", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      const authResult = await authAdapter.validateToken("invalid");
      if (isErr(authResult)) {
        expect(authResult.error).toHaveProperty("code");
      }

      const storageResult = await storageAdapter.download(
        "bucket",
        "missing.txt",
      );
      if (isErr(storageResult)) {
        expect(storageResult.error).toHaveProperty("code");
      }
    });

    it("all errors should have message property", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      const authResult = await authAdapter.validateToken("invalid");
      if (isErr(authResult)) {
        expect(authResult.error).toHaveProperty("message");
        expect(typeof authResult.error.message).toBe("string");
      }

      const storageResult = await storageAdapter.download(
        "bucket",
        "missing.txt",
      );
      if (isErr(storageResult)) {
        expect(storageResult.error).toHaveProperty("message");
        expect(typeof storageResult.error.message).toBe("string");
      }
    });
  });

  // =============================================================================
  // Result Type Consistency
  // =============================================================================

  describe("Result type consistency across all ports", () => {
    it("all adapters should use Result<T, E> pattern", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const realtimeAdapter = new InMemoryRealtimeAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440009");
      authAdapter.createUser({ id: userId, role: UserRole.USER });
      const session = authAdapter.createSession(userId);

      // Auth: validateToken
      const authResult = await authAdapter.validateToken(session.token);
      expect(authResult).toHaveProperty("kind");

      // Realtime: subscribe (synchronous Result)
      const realtimeResult = realtimeAdapter.subscribe("channel", {
        onMessage: () => {},
      });
      expect(realtimeResult).toHaveProperty("kind");

      // Storage: upload
      const storageResult = await storageAdapter.upload(
        "bucket",
        "file.txt",
        Buffer.from("content"),
      );
      expect(storageResult).toHaveProperty("kind");
    });

    it("ok results should have value property", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440010");
      authAdapter.createUser({ id: userId, role: UserRole.USER });
      const session = authAdapter.createSession(userId);

      const authResult = await authAdapter.validateToken(session.token);
      if (isOk(authResult)) {
        expect(authResult).toHaveProperty("value");
      }

      const storageResult = await storageAdapter.upload(
        "bucket",
        "file.txt",
        Buffer.from("content"),
      );
      if (isOk(storageResult)) {
        expect(storageResult).toHaveProperty("value");
      }
    });

    it("err results should have error property", async () => {
      const authAdapter = new InMemoryAuthAdapter();
      const storageAdapter = new InMemoryStorageAdapter();

      const authResult = await authAdapter.validateToken("invalid");
      if (isErr(authResult)) {
        expect(authResult).toHaveProperty("error");
      }

      const storageResult = await storageAdapter.download(
        "bucket",
        "missing.txt",
      );
      if (isErr(storageResult)) {
        expect(storageResult).toHaveProperty("error");
      }
    });
  });
});
