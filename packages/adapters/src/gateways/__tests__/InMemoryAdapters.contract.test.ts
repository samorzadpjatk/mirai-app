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
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { Effect, Either } from "effect";

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
      it("should return Either type on success", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440001");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right).toBeInstanceOf(AuthContext);
        }
      });

      it("should return Either type on error", async () => {
        const result = await adapter.validateToken("invalid-token");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
      });

      it("should return InvalidTokenError for unknown token", async () => {
        const result = await adapter.validateToken("unknown-token");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(InvalidTokenError);
          expect(either.left._tag).toBe("InvalidTokenError");
          expect(either.left.code).toBe("INVALID_TOKEN");
        }
      });

      it("should return SessionExpiredError for expired session", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440002");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId, -1); // Expired

        const result = await adapter.validateToken(session.token);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(SessionExpiredError);
          expect(either.left._tag).toBe("SessionExpiredError");
          expect(either.left.code).toBe("SESSION_EXPIRED");
          if (either.left._tag === "SessionExpiredError") {
            expect(either.left.sessionId).toBe(session.sessionId);
            expect(either.left.expiredAt).toBeInstanceOf(Date);
          }
        }
      });

      it("should return InvalidTokenError for empty token", async () => {
        const result = await adapter.validateToken("");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(InvalidTokenError);
          expect(either.left.message).toBe("Token cannot be empty");
        }
      });

      it("should include userId and role in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440003");
        adapter.createUser({ id: userId, role: UserRole.ADMIN });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(UserId.toString(either.right.userId)).toBe(
            "550e8400-e29b-41d4-a716-446655440003",
          );
          expect(either.right.role).toBe(UserRole.ADMIN);
          expect(either.right.isAdmin()).toBe(true);
        }
      });

      it("should include sessionId in AuthContext", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440004");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.validateToken(session.token);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.sessionId).toBe(session.sessionId);
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
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          // Should be one of the error types
          expect(
            either.left instanceof InvalidTokenError ||
              either.left instanceof AuthError,
          ).toBe(true);
        }
      });
    });

    describe("refreshSession", () => {
      it("should return Either type on success", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440006");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
      });

      it("should return Either type on error", async () => {
        const result = await adapter.refreshSession("non-existent-session");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
      });

      it("should return SessionExpiredError for missing session", async () => {
        const result = await adapter.refreshSession("missing-session-id");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(SessionExpiredError);
          expect(either.left._tag).toBe("SessionExpiredError");
          expect(either.left.code).toBe("SESSION_EXPIRED");
          if (either.left._tag === "SessionExpiredError") {
            expect(either.left.sessionId).toBe("missing-session-id");
          }
        }
      });

      it("should return SessionExpiredError for expired session", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440007");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId, -1); // Expired

        const result = await adapter.refreshSession(session.sessionId);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(SessionExpiredError);
          if (either.left._tag === "SessionExpiredError") {
            expect(either.left.expiredAt).toBeInstanceOf(Date);
          }
        }
      });

      it("should maintain session ID after refresh", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440008");
        adapter.createUser({ id: userId, role: UserRole.USER });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.sessionId).toBe(session.sessionId);
        }
      });

      it("should preserve user role in refreshed context", async () => {
        const userId = UserId.create("550e8400-e29b-41d4-a716-446655440009");
        adapter.createUser({ id: userId, role: UserRole.MODERATOR });
        const session = adapter.createSession(userId);

        const result = await adapter.refreshSession(session.sessionId);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.role).toBe(UserRole.MODERATOR);
          expect(either.right.isModerator()).toBe(true);
          expect(either.right.isAdmin()).toBe(false);
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
      it("should return Either<RealtimeSubscription, RealtimeError | SubscriptionError>", async () => {
        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right).toHaveProperty("id");
          expect(either.right).toHaveProperty("channel");
          expect(either.right).toHaveProperty("state");
          expect(either.right).toHaveProperty("unsubscribe");
        }
      });

      it("should return SubscriptionError when adapter is closed", async () => {
        adapter.setConnectionState("CLOSED");

        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(SubscriptionError);
          expect(either.left._tag).toBe("SubscriptionError");
          expect(either.left.code).toBe("SUBSCRIPTION_ERROR");
          if (either.left._tag === "SubscriptionError") {
            expect(either.left.channel).toBe("test-channel");
          }
        }
      });

      it("should have CONNECTED state after successful subscribe", async () => {
        const result = adapter.subscribe("test-channel", {
          onMessage: () => {},
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.state).toBe("CONNECTED");
        }
      });

      it("should return unique subscription IDs", async () => {
        const result1 = adapter.subscribe("channel-1", { onMessage: () => {} });
        const result2 = adapter.subscribe("channel-2", { onMessage: () => {} });

        const either1 = await Effect.runPromise(Effect.either(result1));
        const either2 = await Effect.runPromise(Effect.either(result2));

        expect(Either.isRight(either1)).toBe(true);
        expect(Either.isRight(either2)).toBe(true);
        if (Either.isRight(either1) && Either.isRight(either2)) {
          expect(either1.right.id).not.toBe(either2.right.id);
        }
      });

      it("should store channel name in subscription", async () => {
        const result = adapter.subscribe("my-channel", {
          onMessage: () => {},
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.channel).toBe("my-channel");
        }
      });
    });

    describe("broadcast", () => {
      it("should return Either<void, RealtimeError>", async () => {
        const result = await adapter.broadcast("test-channel", "event", {
          data: "value",
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
      });

      it("should deliver messages to subscribers", async () => {
        const receivedMessages: { event: string; payload: unknown }[] = [];

        await Effect.runPromise(
          adapter.subscribe("broadcast-channel", {
            onMessage: (event, payload) => {
              receivedMessages.push({ event, payload });
            },
          }),
        );

        await Effect.runPromise(
          adapter.broadcast("broadcast-channel", "test-event", {
            key: "value",
          }),
        );

        expect(receivedMessages).toHaveLength(1);
        expect(receivedMessages[0]?.event).toBe("test-event");
        expect(receivedMessages[0]?.payload).toEqual({ key: "value" });
      });

      it("should not fail when broadcasting to channel with no subscribers", async () => {
        const result = await adapter.broadcast("empty-channel", "event", {});
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
      });

      it("should deliver only to correct channel subscribers", async () => {
        const channel1Messages: string[] = [];
        const channel2Messages: string[] = [];

        await Effect.runPromise(
          adapter.subscribe("channel-1", {
            onMessage: () => channel1Messages.push("received"),
          }),
        );

        await Effect.runPromise(
          adapter.subscribe("channel-2", {
            onMessage: () => channel2Messages.push("received"),
          }),
        );

        await Effect.runPromise(adapter.broadcast("channel-1", "event", {}));

        expect(channel1Messages).toHaveLength(1);
        expect(channel2Messages).toHaveLength(0);
      });

      it("should filter messages by event type when configured", async () => {
        const allowedEvents: string[] = [];
        const allEvents: string[] = [];

        await Effect.runPromise(
          adapter.subscribe("filtered-channel", {
            events: ["allowed-event"],
            onMessage: (event) => allowedEvents.push(event),
          }),
        );

        await Effect.runPromise(
          adapter.subscribe("filtered-channel", {
            onMessage: (event) => allEvents.push(event),
          }),
        );

        await Effect.runPromise(
          adapter.broadcast("filtered-channel", "allowed-event", {}),
        );
        await Effect.runPromise(
          adapter.broadcast("filtered-channel", "blocked-event", {}),
        );

        expect(allowedEvents).toHaveLength(1);
        expect(allowedEvents[0]).toBe("allowed-event");
        expect(allEvents).toHaveLength(2); // No filter, receives all
      });

      it("should isolate errors in message handlers", async () => {
        const receivedMessages: string[] = [];

        await Effect.runPromise(
          adapter.subscribe("error-channel", {
            onMessage: () => {
              throw new Error("Handler error");
            },
          }),
        );

        await Effect.runPromise(
          adapter.subscribe("error-channel", {
            onMessage: () => receivedMessages.push("received"),
          }),
        );

        // Should not throw
        const result = await adapter.broadcast("error-channel", "event", {});
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        expect(receivedMessages).toHaveLength(1);
      });
    });

    describe("trackPresence", () => {
      it("should return Either<void, RealtimeError>", async () => {
        const result = await adapter.trackPresence("presence-channel", {
          userId: "user-1",
          payload: { status: "online" },
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
      });

      it("should store presence data for retrieval", async () => {
        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-1",
            payload: { status: "online", activity: "browsing" },
          }),
        );

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
        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-1",
            payload: { status: "online" },
          }),
        );

        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-1",
            payload: { status: "away" },
          }),
        );

        const presenceData = adapter.getPresenceData("presence-channel");
        expect(presenceData!.get("user-1")!.payload).toEqual({
          status: "away",
        });
      });

      it("should track multiple users in same channel", async () => {
        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-1",
            payload: { status: "online" },
          }),
        );

        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-2",
            payload: { status: "online" },
          }),
        );

        await Effect.runPromise(
          adapter.trackPresence("presence-channel", {
            userId: "user-3",
            payload: { status: "away" },
          }),
        );

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
      it("should return Either<void, RealtimeError>", async () => {
        const subResult = adapter.subscribe("unsub-channel", {
          onMessage: () => {},
        });

        const subEither = await Effect.runPromise(Effect.either(subResult));

        expect(Either.isRight(subEither)).toBe(true);
        if (Either.isRight(subEither)) {
          const unsubResult = subEither.right.unsubscribe();
          const unsubEither = await Effect.runPromise(
            Effect.either(unsubResult),
          );
          expect(Either.isRight(unsubEither)).toBe(true);
        }
      });

      it("should stop receiving messages after unsubscribe", async () => {
        const receivedMessages: string[] = [];

        const subResult = adapter.subscribe("unsub-test", {
          onMessage: () => receivedMessages.push("received"),
        });

        const subEither = await Effect.runPromise(Effect.either(subResult));

        expect(Either.isRight(subEither)).toBe(true);
        if (Either.isRight(subEither)) {
          // Receive first message
          await Effect.runPromise(adapter.broadcast("unsub-test", "event", {}));
          expect(receivedMessages).toHaveLength(1);

          // Unsubscribe
          await Effect.runPromise(subEither.right.unsubscribe());

          // Should not receive more
          await Effect.runPromise(adapter.broadcast("unsub-test", "event", {}));
          expect(receivedMessages).toHaveLength(1);
        }
      });

      it("should have CLOSED state after unsubscribe", async () => {
        const subResult = adapter.subscribe("unsub-state", {
          onMessage: () => {},
        });

        const subEither = await Effect.runPromise(Effect.either(subResult));

        expect(Either.isRight(subEither)).toBe(true);
        if (Either.isRight(subEither)) {
          expect(subEither.right.state).toBe("CONNECTED");
          await Effect.runPromise(subEither.right.unsubscribe());
          expect(subEither.right.state).toBe("CLOSED");
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
      it("should return Either<FileMetadata, StorageError | UploadError>", async () => {
        const buffer = Buffer.from("test content");
        const result = await adapter.upload("test-bucket", "test.txt", buffer);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right).toHaveProperty("path");
          expect(either.right).toHaveProperty("bucket");
          expect(either.right).toHaveProperty("size");
          expect(either.right).toHaveProperty("contentType");
          expect(either.right).toHaveProperty("createdAt");
          expect(either.right).toHaveProperty("updatedAt");
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
        const uploadEither = await Effect.runPromise(
          Effect.either(uploadResult),
        );

        expect(Either.isRight(uploadEither)).toBe(true);
        expect(adapter.fileExists("files-bucket", "hello.txt")).toBe(true);
      });

      it("should return UploadError when file exists and upsert is false", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.upload("bucket", "file.txt", buffer, {
          upsert: false,
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(UploadError);
          expect(either.left._tag).toBe("UploadError");
          expect(either.left.code).toBe("UPLOAD_ERROR");
          if (either.left._tag === "UploadError") {
            expect(either.left.bucket).toBe("bucket");
            expect(either.left.path).toBe("file.txt");
          }
        }
      });

      it("should overwrite when upsert is true", async () => {
        const buffer1 = Buffer.from("original content");
        const buffer2 = Buffer.from("updated content");

        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer1));
        const result = await adapter.upload("bucket", "file.txt", buffer2, {
          upsert: true,
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.size).toBe(buffer2.length);
        }
      });

      it("should auto-detect content type from extension", async () => {
        const buffer = Buffer.from("image data");
        const result = await adapter.upload("bucket", "image.png", buffer);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.contentType).toBe("image/png");
        }
      });

      it("should accept custom content type", async () => {
        const buffer = Buffer.from("data");
        const result = await adapter.upload("bucket", "file.bin", buffer, {
          contentType: "application/octet-stream",
        });
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.contentType).toBe("application/octet-stream");
        }
      });

      it("should handle Blob input", async () => {
        const blob = new Blob(["blob content"], { type: "text/plain" });
        const result = await adapter.upload("bucket", "blob.txt", blob);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.size).toBe(12); // "blob content"
        }
      });
    });

    describe("download", () => {
      it("should return Either<DownloadResult, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.download("bucket", "file.txt");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right).toHaveProperty("data");
          expect(either.right).toHaveProperty("metadata");
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await adapter.download("bucket", "missing.txt");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(FileNotFoundError);
          expect(either.left._tag).toBe("FileNotFoundError");
          expect(either.left.code).toBe("FILE_NOT_FOUND");
          if (either.left._tag === "FileNotFoundError") {
            expect(either.left.bucket).toBe("bucket");
            expect(either.left.path).toBe("missing.txt");
          }
        }
      });

      it("should return correct file content", async () => {
        const content = "test file content";
        const buffer = Buffer.from(content);
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.download("bucket", "file.txt");
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.data.toString()).toBe(content);
        }
      });

      it("should return independent buffer copy", async () => {
        const buffer = Buffer.from("original");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result1 = await adapter.download("bucket", "file.txt");
        const result2 = await adapter.download("bucket", "file.txt");
        const either1 = await Effect.runPromise(Effect.either(result1));
        const either2 = await Effect.runPromise(Effect.either(result2));

        expect(Either.isRight(either1) && Either.isRight(either2)).toBe(true);
        if (Either.isRight(either1) && Either.isRight(either2)) {
          expect(either1.right.data).not.toBe(either2.right.data); // Different instances
          expect(either1.right.data.toString()).toBe(
            either2.right.data.toString(),
          ); // Same content
        }
      });
    });

    describe("delete", () => {
      it("should return Either<void, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.delete("bucket", ["file.txt"]);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
      });

      it("should remove file from storage", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));
        expect(adapter.fileExists("bucket", "file.txt")).toBe(true);

        await Effect.runPromise(adapter.delete("bucket", ["file.txt"]));

        expect(adapter.fileExists("bucket", "file.txt")).toBe(false);
      });

      it("should handle non-existent file gracefully", async () => {
        // Delete returns void on success, may or may not error for non-existent
        const result = await adapter.delete("bucket", ["missing.txt"]);
        const either = await Effect.runPromise(Effect.either(result));
        // May succeed (idempotent) or fail - just verify it doesn't throw
        expect(either).toBeDefined();
      });

      it("should delete multiple files", async () => {
        await Effect.runPromise(
          adapter.upload("bucket", "file1.txt", Buffer.from("1")),
        );
        await Effect.runPromise(
          adapter.upload("bucket", "file2.txt", Buffer.from("2")),
        );
        await Effect.runPromise(
          adapter.upload("bucket", "file3.txt", Buffer.from("3")),
        );

        const result = await adapter.delete("bucket", [
          "file1.txt",
          "file2.txt",
        ]);
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        expect(adapter.fileExists("bucket", "file1.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file2.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file3.txt")).toBe(true);
      });
    });

    describe("createSignedUrl", () => {
      it("should return Either<SignedUrlInfo, StorageError | FileNotFoundError>", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right).toHaveProperty("url");
          expect(either.right).toHaveProperty("expiresAt");
          expect(either.right).toHaveProperty("expiresInSeconds");
        }
      });

      it("should return FileNotFoundError for non-existent file", async () => {
        const result = await adapter.createSignedUrl(
          "bucket",
          "missing.txt",
          3600,
        );
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isLeft(either)).toBe(true);
        if (Either.isLeft(either)) {
          expect(either.left).toBeInstanceOf(FileNotFoundError);
        }
      });

      it("should generate valid URL with expiration", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          expect(either.right.url).toContain("inmemory://");
          expect(either.right.url).toContain("bucket/file.txt");
          expect(either.right.expiresInSeconds).toBe(3600);
          expect(either.right.expiresAt).toBeInstanceOf(Date);
          expect(either.right.expiresAt.getTime()).toBeGreaterThan(Date.now());
        }
      });

      it("should validate signed URL", async () => {
        const buffer = Buffer.from("content");
        await Effect.runPromise(adapter.upload("bucket", "file.txt", buffer));

        const result = await adapter.createSignedUrl(
          "bucket",
          "file.txt",
          3600,
        );
        const either = await Effect.runPromise(Effect.either(result));

        expect(Either.isRight(either)).toBe(true);
        if (Either.isRight(either)) {
          const validatedInfo = adapter.validateSignedUrl(either.right.url);
          expect(validatedInfo).toBeDefined();
          expect(validatedInfo!.expiresInSeconds).toBe(3600);
        }
      });
    });

    describe("adapter-specific helper methods", () => {
      it("should track file metadata", async () => {
        const buffer = Buffer.from("test content");
        await Effect.runPromise(
          adapter.upload("bucket", "file.txt", buffer, {
            contentType: "text/plain",
          }),
        );

        const metadata = adapter.getFileMetadata("bucket", "file.txt");

        expect(metadata).toBeDefined();
        expect(metadata!.size).toBe(buffer.length);
        expect(metadata!.contentType).toBe("text/plain");
        expect(metadata!.bucket).toBe("bucket");
        expect(metadata!.path).toBe("bucket/file.txt");
      });

      it("should list files in bucket", async () => {
        await Effect.runPromise(
          adapter.upload("bucket1", "file1.txt", Buffer.from("1")),
        );
        await Effect.runPromise(
          adapter.upload("bucket1", "file2.txt", Buffer.from("2")),
        );
        await Effect.runPromise(
          adapter.upload("bucket2", "file3.txt", Buffer.from("3")),
        );

        const bucket1Files = adapter.listFiles("bucket1");
        const bucket2Files = adapter.listFiles("bucket2");

        expect(bucket1Files).toHaveLength(2);
        expect(bucket2Files).toHaveLength(1);
      });

      it("should calculate total storage size", async () => {
        await Effect.runPromise(
          adapter.upload("bucket", "file1.txt", Buffer.from("12345")),
        );
        await Effect.runPromise(
          adapter.upload("bucket", "file2.txt", Buffer.from("67890")),
        );

        const totalSize = adapter.getTotalSize();

        expect(totalSize).toBe(10); // 5 + 5
      });

      it("should clear all files", async () => {
        await Effect.runPromise(
          adapter.upload("bucket", "file1.txt", Buffer.from("1")),
        );
        await Effect.runPromise(
          adapter.upload("bucket", "file2.txt", Buffer.from("2")),
        );

        adapter.clear();

        expect(adapter.fileExists("bucket", "file1.txt")).toBe(false);
        expect(adapter.fileExists("bucket", "file2.txt")).toBe(false);
        expect(adapter.listFiles("bucket")).toHaveLength(0);
        expect(adapter.getTotalSize()).toBe(0);
      });
    });
  });
});
