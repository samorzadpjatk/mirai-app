import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "@mirai-app/domain";
import {
  handleEffect,
  effectToControllerResult,
  handleEffectAsync,
  handleEffectGraphQL,
} from "../controller-helpers";
import {
  UnauthorizedError as HttpUnauthorizedError,
  NotFoundError as HttpNotFoundError,
  BadRequestError as HttpBadRequestError,
} from "../../api/errors";

describe("[UNIT] controller-helpers - Effect functions", () => {
  // ============================================================================
  // handleEffect
  // ============================================================================
  describe("handleEffect", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await handleEffect(effect);
      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should throw HttpNotFoundError for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      try {
        await handleEffect(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpNotFoundError);
        expect((e as HttpNotFoundError).message).toBe(error.message);
      }
    });

    it("should throw HttpBadRequestError for ValidationError", async () => {
      const error = ValidationError.forField("email", "Invalid format");
      const effect = Effect.fail(error);

      try {
        await handleEffect(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpBadRequestError);
      }
    });

    it("should throw HttpUnauthorizedError for UnauthorizedError", async () => {
      const error = UnauthorizedError.forOperation("deleteUser");
      const effect = Effect.fail(error);

      try {
        await handleEffect(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpUnauthorizedError);
      }
    });
  });

  // ============================================================================
  // effectToControllerResult
  // ============================================================================
  describe("effectToControllerResult", () => {
    it("should return success ControllerResult for successful Effect", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await effectToControllerResult(effect);

      expect(result).toEqual({
        success: true,
        data: { id: "1", name: "Test" },
      });
    });

    it("should return error ControllerResult for failed Effect", async () => {
      const error = ValidationError.forField("email", "Invalid format");
      const effect = Effect.fail(error);
      const result = await effectToControllerResult(effect);

      expect(result).toEqual({
        success: false,
        error: error.message,
      });
    });

    it("should apply transform function for successful Effect", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await effectToControllerResult(effect, (value) => ({
        ...value,
        transformed: true,
      }));

      expect(result).toEqual({
        success: true,
        data: { id: "1", name: "Test", transformed: true },
      });
    });

    it("should not apply transform for failed Effect", async () => {
      const error = ValidationError.forField("email", "Invalid format");
      const effect = Effect.fail(error);
      const result = await effectToControllerResult(effect, () => ({
        shouldNot: "appear",
      }));

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  // ============================================================================
  // handleEffectAsync
  // ============================================================================
  describe("handleEffectAsync", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await handleEffectAsync(effect);
      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should apply async transform function", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await handleEffectAsync(effect, async (value) => ({
        ...value,
        asyncTransformed: true,
      }));

      expect(result).toEqual({
        id: "1",
        name: "Test",
        asyncTransformed: true,
      });
    });

    it("should throw HttpNotFoundError for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      try {
        await handleEffectAsync(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpNotFoundError);
      }
    });

    it("should not apply transform for failed Effect", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      try {
        await handleEffectAsync(effect, async () => ({ transformed: true }));
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpNotFoundError);
      }
    });
  });

  // ============================================================================
  // handleEffectGraphQL
  // ============================================================================
  describe("handleEffectGraphQL", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed({ id: "1", name: "Test" });
      const result = await handleEffectGraphQL(effect);
      expect(result).toEqual({ id: "1", name: "Test" });
    });

    it("should throw GraphQLError for ValidationError", async () => {
      const error = ValidationError.forField("email", "Invalid format");
      const effect = Effect.fail(error);

      try {
        await handleEffectGraphQL(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect((e as { extensions: { code: string } }).extensions.code).toBe(
          "BAD_USER_INPUT",
        );
      }
    });

    it("should throw GraphQLError for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      try {
        await handleEffectGraphQL(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect((e as { extensions: { code: string } }).extensions.code).toBe(
          "NOT_FOUND",
        );
        expect(
          (e as { extensions: { entityType: string } }).extensions.entityType,
        ).toBe("User");
      }
    });

    it("should throw GraphQLError for UnauthorizedError", async () => {
      const error = UnauthorizedError.forOperation("deleteUser");
      const effect = Effect.fail(error);

      try {
        await handleEffectGraphQL(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect((e as { extensions: { code: string } }).extensions.code).toBe(
          "UNAUTHENTICATED",
        );
      }
    });
  });
});
