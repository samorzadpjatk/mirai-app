/**
 * InMemoryStorageGateway Tests
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryStorageGateway } from "./InMemoryStorageGateway";
import { DatabaseError } from "@mirai-app/domain";

describe("[UNIT] InMemoryStorageGateway", () => {
  let gateway: InMemoryStorageGateway;

  beforeEach(() => {
    gateway = new InMemoryStorageGateway();
  });

  describe("upload", () => {
    it("should upload file with Either pattern", async () => {
      const file = new Blob(["test content"], { type: "text/plain" });
      const effect = gateway.upload("test-bucket", "test/path.txt", file);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeDefined();
      }
    });
  });

  describe("download", () => {
    it("should download file with Either pattern after upload", async () => {
      // First upload a file
      const file = new Blob(["test content"], { type: "text/plain" });
      await Effect.runPromise(
        gateway.upload("test-bucket", "test/path.txt", file),
      );

      // Then download it
      const effect = gateway.download("test-bucket", "test/path.txt");

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      if (Either.isRight(either)) {
        expect(either.right).toBeDefined();
      }
    });
  });

  describe("Either pattern", () => {
    it("should use Effect.either with Either.isLeft/isRight and instanceof", async () => {
      const file = new Blob(["test"], { type: "text/plain" });
      const effect = gateway.upload("bucket", "path/file.txt", file);

      const either = await Effect.runPromise(Effect.either(effect));

      expect(Either.isRight(either)).toBe(true);
      expect(Either.isLeft(either)).toBe(false);

      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DatabaseError);
      }
    });
  });
});
