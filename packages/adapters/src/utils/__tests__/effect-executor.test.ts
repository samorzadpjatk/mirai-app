import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  InvariantError,
  InvalidStateError,
  ResourceUnavailableError,
  QuotaExceededError,
  StateTransitionError,
} from "@mirai-app/domain";
import {
  runEffect,
  runEffectWithHandler,
  runEffectGraphQL,
  runEffectGraphQLWithHandler,
  mapErrorToHttpStatus,
  mapDomainErrorToHttpError,
  mapErrorToGraphQLCode,
  mapErrorToGraphQL,
  isDomainError,
  getErrorTag,
} from "../effect-executor";
import {
  UnauthorizedError as HttpUnauthorizedError,
  ForbiddenError as HttpForbiddenError,
  NotFoundError as HttpNotFoundError,
  BadRequestError as HttpBadRequestError,
} from "../../api/errors";

describe("[UNIT] effect-executor", () => {
  // ============================================================================
  // runEffect
  // ============================================================================
  describe("[UNIT] runEffect", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed(42);
      const result = await runEffect(effect);
      expect(result).toBe(42);
    });

    it("should throw HttpNotFoundError for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      try {
        await runEffect(effect);
        expect(false).toBe(true); // Should not reach here
      } catch (e) {
        expect(e).toBeInstanceOf(HttpNotFoundError);
        expect((e as HttpNotFoundError).message).toBe(error.message);
      }
    });

    it("should throw HttpBadRequestError for ValidationError", async () => {
      const error = ValidationError.forField("email", "Invalid format");
      const effect = Effect.fail(error);

      try {
        await runEffect(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpBadRequestError);
        expect((e as HttpBadRequestError).message).toBe(error.message);
      }
    });

    it("should throw HttpUnauthorizedError for UnauthorizedError", async () => {
      const error = UnauthorizedError.forOperation("updateUser");
      const effect = Effect.fail(error);

      try {
        await runEffect(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpUnauthorizedError);
        expect((e as HttpUnauthorizedError).message).toBe(error.message);
      }
    });
  });

  // ============================================================================
  // runEffectWithHandler
  // ============================================================================
  describe("[UNIT] runEffectWithHandler", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed("data");
      const result = await runEffectWithHandler(effect, {});
      expect(result).toBe("data");
    });

    it("should call onNotFound handler for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      const result = await runEffectWithHandler(effect, {
        onNotFound: () => null,
      });

      expect(result).toBeNull();
    });

    it("should call onValidationError handler for ValidationError", async () => {
      const error = ValidationError.forField("email", "Invalid");
      const effect = Effect.fail(error);

      const result = await runEffectWithHandler(effect, {
        onValidationError: () => "handled",
      });

      expect(result).toBe("handled");
    });

    it("should throw when no handler matches", async () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      const effect = Effect.fail(error);

      try {
        await runEffectWithHandler(effect, {
          onValidationError: () => "wrong handler",
        });
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpBadRequestError);
      }
    });

    it("should call onDefault handler for truly unmatched errors", async () => {
      // Create an unknown error type that doesn't have a specific handler
      const unknownError = new Error("Unknown") as DomainError;
      (unknownError as { _tag: string })._tag = "UnknownErrorType";
      (unknownError as { message: string }).message = "Unknown error";
      const effect = Effect.fail(unknownError);

      const result = await runEffectWithHandler(effect, {
        onDefault: () => "default handled",
      });

      expect(result).toBe("default handled");
    });

    it("should call specific handler over onDefault when both provided", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      const result = await runEffectWithHandler(effect, {
        onNotFound: () => "specific",
        onDefault: () => "default",
      });

      expect(result).toBe("specific");
    });

    it("should call onInvariant handler for InvariantError", async () => {
      const error = InvariantError.create(
        "Invariant violated",
        "test-invariant",
      );
      const effect = Effect.fail(error);

      const result = await runEffectWithHandler(effect, {
        onInvariant: () => "invariant handled",
      });

      expect(result).toBe("invariant handled");
    });

    it("should handle all error types with specific handlers", async () => {
      const handlers = {
        onValidationError: () => "validation",
        onNotFound: () => "notFound",
        onUnauthorized: () => "unauthorized",
        onConflict: () => "conflict",
        onInvariant: () => "invariant",
        onInvalidState: () => "invalidState",
        onResourceUnavailable: () => "resourceUnavailable",
        onQuotaExceeded: () => "quotaExceeded",
        onStateTransition: () => "stateTransition",
      };

      expect(
        await runEffectWithHandler(
          Effect.fail(ValidationError.forField("x", "y")),
          handlers,
        ),
      ).toBe("validation");
      expect(
        await runEffectWithHandler(
          Effect.fail(NotFoundError.forEntity("x", "y")),
          handlers,
        ),
      ).toBe("notFound");
      expect(
        await runEffectWithHandler(
          Effect.fail(UnauthorizedError.forOperation("x")),
          handlers,
        ),
      ).toBe("unauthorized");
      expect(
        await runEffectWithHandler(
          Effect.fail(ConflictError.duplicate("x", "y")),
          handlers,
        ),
      ).toBe("conflict");
      expect(
        await runEffectWithHandler(
          Effect.fail(InvariantError.create("msg", "inv")),
          handlers,
        ),
      ).toBe("invariant");
      expect(
        await runEffectWithHandler(
          Effect.fail(InvalidStateError.create("msg", "s")),
          handlers,
        ),
      ).toBe("invalidState");
      expect(
        await runEffectWithHandler(
          Effect.fail(ResourceUnavailableError.create("msg", "res")),
          handlers,
        ),
      ).toBe("resourceUnavailable");
      expect(
        await runEffectWithHandler(
          Effect.fail(QuotaExceededError.create("msg", "q", 1, 5)),
          handlers,
        ),
      ).toBe("quotaExceeded");
      expect(
        await runEffectWithHandler(
          Effect.fail(StateTransitionError.create("from", "to")),
          handlers,
        ),
      ).toBe("stateTransition");
    });

    it("should use onDefault only for truly unknown error types", async () => {
      // Test that onDefault is only called for unknown error types
      const unknownError = new Error("Unknown") as DomainError;
      (unknownError as { _tag: string })._tag = "UnknownErrorType";
      (unknownError as { message: string }).message = "Unknown error";
      const effect = Effect.fail(unknownError);

      const result = await runEffectWithHandler(effect, {
        onValidationError: () => "wrong handler",
        onDefault: () => "default handled",
      });

      expect(result).toBe("default handled");
    });

    it("should throw HttpError when known error type has no specific handler", async () => {
      // Known error types (like InvariantError) should throw HttpError when no handler provided
      const invariantError = InvariantError.create(
        "Invariant violated",
        "test",
      );
      const effect = Effect.fail(invariantError);

      try {
        await runEffectWithHandler(effect, {
          onValidationError: () => "wrong handler",
        });
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpBadRequestError);
      }
    });
  });

  // ============================================================================
  // mapErrorToHttpStatus
  // ============================================================================
  describe("[UNIT] mapErrorToHttpStatus", () => {
    it("should map ValidationError to 400", () => {
      const error = ValidationError.forField("email", "Invalid");
      expect(mapErrorToHttpStatus(error)).toBe(400);
    });

    it("should map NotFoundError to 404", () => {
      const error = NotFoundError.forEntity("User", "123");
      expect(mapErrorToHttpStatus(error)).toBe(404);
    });

    it("should map UnauthorizedError to 401", () => {
      const error = UnauthorizedError.forOperation("delete");
      expect(mapErrorToHttpStatus(error)).toBe(401);
    });

    it("should map ConflictError to 409", () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      expect(mapErrorToHttpStatus(error)).toBe(409);
    });

    it("should map InvariantError to 400", () => {
      const error = InvariantError.create("Invariant violated", "test");
      expect(mapErrorToHttpStatus(error)).toBe(400);
    });

    it("should map InvalidStateError to 400", () => {
      const error = InvalidStateError.create("Invalid state", "active");
      expect(mapErrorToHttpStatus(error)).toBe(400);
    });

    it("should map ResourceUnavailableError to 503", () => {
      const error = ResourceUnavailableError.create(
        "Resource unavailable",
        "Database",
      );
      expect(mapErrorToHttpStatus(error)).toBe(503);
    });

    it("should map QuotaExceededError to 429", () => {
      const error = QuotaExceededError.create(
        "Quota exceeded",
        "requests",
        100,
        100,
      );
      expect(mapErrorToHttpStatus(error)).toBe(429);
    });

    it("should map StateTransitionError to 400", () => {
      const error = StateTransitionError.create("pending", "active");
      expect(mapErrorToHttpStatus(error)).toBe(400);
    });

    it("should map unknown errors to 500", () => {
      const error = new Error("Unknown") as DomainError;
      (error as { _tag: string })._tag = "UnknownError";
      expect(mapErrorToHttpStatus(error)).toBe(500);
    });
  });

  // ============================================================================
  // mapDomainErrorToHttpError
  // ============================================================================
  describe("[UNIT] mapDomainErrorToHttpError", () => {
    it("should create HttpBadRequestError for ValidationError", () => {
      const error = ValidationError.forField("email", "Invalid format");
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpBadRequestError);
      expect(httpError.message).toBe(error.message);
      expect(httpError.statusCode).toBe(400);
    });

    it("should create HttpNotFoundError for NotFoundError", () => {
      const error = NotFoundError.forEntity("User", "123");
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpNotFoundError);
      expect(httpError.message).toBe(error.message);
      expect(httpError.statusCode).toBe(404);
    });

    it("should create HttpUnauthorizedError for UnauthorizedError", () => {
      const error = UnauthorizedError.forOperation("delete");
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpUnauthorizedError);
      expect(httpError.message).toBe(error.message);
      expect(httpError.statusCode).toBe(401);
    });

    it("should create HttpBadRequestError for ConflictError", () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpBadRequestError);
    });

    it("should create HttpForbiddenError for QuotaExceededError", () => {
      const error = QuotaExceededError.create(
        "Quota exceeded",
        "requests",
        100,
        100,
      );
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpForbiddenError);
    });

    it("should create HttpBadRequestError for ResourceUnavailableError", () => {
      const error = ResourceUnavailableError.create("Unavailable", "Database");
      const httpError = mapDomainErrorToHttpError(error);

      expect(httpError).toBeInstanceOf(HttpBadRequestError);
    });
  });

  // ============================================================================
  // mapErrorToGraphQLCode
  // ============================================================================
  describe("[UNIT] mapErrorToGraphQLCode", () => {
    it("should map ValidationError to BAD_USER_INPUT", () => {
      const error = ValidationError.forField("email", "Invalid");
      expect(mapErrorToGraphQLCode(error)).toBe("BAD_USER_INPUT");
    });

    it("should map NotFoundError to NOT_FOUND", () => {
      const error = NotFoundError.forEntity("User", "123");
      expect(mapErrorToGraphQLCode(error)).toBe("NOT_FOUND");
    });

    it("should map UnauthorizedError to UNAUTHENTICATED", () => {
      const error = UnauthorizedError.forOperation("delete");
      expect(mapErrorToGraphQLCode(error)).toBe("UNAUTHENTICATED");
    });

    it("should map ConflictError to CONFLICT", () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      expect(mapErrorToGraphQLCode(error)).toBe("CONFLICT");
    });

    it("should map InvariantError to BAD_USER_INPUT", () => {
      const error = InvariantError.create("Invariant violated", "test");
      expect(mapErrorToGraphQLCode(error)).toBe("BAD_USER_INPUT");
    });

    it("should map QuotaExceededError to INTERNAL_SERVER_ERROR", () => {
      const error = QuotaExceededError.create(
        "Quota exceeded",
        "requests",
        100,
        100,
      );
      expect(mapErrorToGraphQLCode(error)).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should map unknown errors to INTERNAL_SERVER_ERROR", () => {
      const error = new Error("Unknown") as DomainError;
      (error as { _tag: string })._tag = "UnknownError";
      expect(mapErrorToGraphQLCode(error)).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  // ============================================================================
  // mapErrorToGraphQL
  // ============================================================================
  describe("[UNIT] mapErrorToGraphQL", () => {
    it("should create GraphQLError with message and extensions", () => {
      const error = ValidationError.forField("email", "Invalid format");
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.message).toBe(error.message);
      expect(graphqlError.extensions).toBeDefined();
      expect(graphqlError.extensions.code).toBe("BAD_USER_INPUT");
      expect(graphqlError.extensions.tag).toBe("ValidationError");
    });

    it("should include field in extensions for ValidationError", () => {
      const error = ValidationError.forField("email", "Invalid format");
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.extensions.field).toBe("email");
    });

    it("should include entityType and id in extensions for NotFoundError", () => {
      const error = NotFoundError.forEntity("User", "123");
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.extensions.entityType).toBe("User");
      expect(graphqlError.extensions.id).toBe("123");
    });

    it("should include field in extensions for ConflictError", () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.extensions.field).toBe("email");
    });

    it("should include state info in extensions for InvalidStateError", () => {
      const error = InvalidStateError.create("Invalid", "pending", "active");
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.extensions.currentState).toBe("pending");
      expect(graphqlError.extensions.requiredState).toBe("active");
    });

    it("should include quota info in extensions for QuotaExceededError", () => {
      const error = QuotaExceededError.create(
        "Quota exceeded",
        "requests",
        100,
        100,
      );
      const graphqlError = mapErrorToGraphQL(error);

      expect(graphqlError.extensions.quota).toBe("requests");
      expect(graphqlError.extensions.current).toBe(100);
      expect(graphqlError.extensions.maximum).toBe(100);
    });
  });

  // ============================================================================
  // runEffectGraphQL
  // ============================================================================
  describe("[UNIT] runEffectGraphQL", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed(42);
      const result = await runEffectGraphQL(effect);
      expect(result).toBe(42);
    });

    it("should throw GraphQLError for ValidationError", async () => {
      const error = ValidationError.forField("email", "Invalid");
      const effect = Effect.fail(error);

      try {
        await runEffectGraphQL(effect);
        expect(false).toBe(true);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect((e as { extensions: { code: string } }).extensions.code).toBe(
          "BAD_USER_INPUT",
        );
      }
    });
  });

  // ============================================================================
  // runEffectGraphQLWithHandler
  // ============================================================================
  describe("[UNIT] runEffectGraphQLWithHandler", () => {
    it("should return success value for successful Effect", async () => {
      const effect = Effect.succeed("data");
      const result = await runEffectGraphQLWithHandler(effect, {});
      expect(result).toBe("data");
    });

    it("should call onNotFound handler for NotFoundError", async () => {
      const error = NotFoundError.forEntity("User", "123");
      const effect = Effect.fail(error);

      const result = await runEffectGraphQLWithHandler(effect, {
        onNotFound: () => null,
      });

      expect(result).toBeNull();
    });

    it("should throw GraphQLError when no handler matches", async () => {
      const error = ConflictError.duplicate("email", "test@test.com");
      const effect = Effect.fail(error);

      try {
        await runEffectGraphQLWithHandler(effect, {
          onValidationError: () => "wrong",
        });
        expect(false).toBe(true);
      } catch (e) {
        expect((e as { extensions: { code: string } }).extensions.code).toBe(
          "CONFLICT",
        );
      }
    });
  });

  // ============================================================================
  // isDomainError
  // ============================================================================
  describe("[UNIT] isDomainError", () => {
    it("should return true for domain errors", () => {
      const error = ValidationError.forField("email", "Invalid");
      expect(isDomainError(error)).toBe(true);
    });

    it("should return false for regular Errors", () => {
      const error = new Error("Regular error");
      expect(isDomainError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isDomainError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isDomainError(undefined)).toBe(false);
    });

    it("should return false for strings", () => {
      expect(isDomainError("error")).toBe(false);
    });
  });

  // ============================================================================
  // getErrorTag
  // ============================================================================
  describe("[UNIT] getErrorTag", () => {
    it("should return _tag for domain errors", () => {
      const error = ValidationError.forField("email", "Invalid");
      expect(getErrorTag(error)).toBe("ValidationError");
    });

    it("should return undefined for regular Errors", () => {
      const error = new Error("Regular error");
      expect(getErrorTag(error)).toBeUndefined();
    });

    it("should return undefined for null", () => {
      expect(getErrorTag(null)).toBeUndefined();
    });
  });
});
