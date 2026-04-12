/**
 * Unit Tests for Effect-Based Domain Errors
 *
 * @module effect-errors.test
 */

import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  ValidationError,
  NotFoundError,
  StateTransitionError,
  UnauthorizedError,
  ConflictError,
  InvariantError,
  InvalidStateError,
  ResourceUnavailableError,
  QuotaExceededError,
  isDomainError,
  isValidationError,
  isNotFoundError,
  isStateTransitionError,
  isUnauthorizedError,
  isConflictError,
  isInvariantError,
  getDomainErrorMessage,
  getDomainErrorCode,
  type DomainError,
} from "../errors/effect-errors";

describe("[UNIT] effect-errors", () => {
  describe("ValidationError", () => {
    it("should create a basic validation error", () => {
      const error = new ValidationError({ message: "Invalid input" });
      expect(error._tag).toBe("ValidationError");
      expect(error.message).toBe("Invalid input");
      expect(error.field).toBeUndefined();
    });

    it("should create a validation error with field", () => {
      const error = new ValidationError({
        message: "Name is required",
        field: "name",
      });
      expect(error.field).toBe("name");
      expect(error.message).toBe("Name is required");
    });

    it("should support static factory methods", () => {
      const forField = ValidationError.forField("email", "Invalid format");
      expect(forField.field).toBe("email");
      expect(forField.message).toBe("email: Invalid format");

      const required = ValidationError.required("name");
      expect(required.field).toBe("name");
      expect(required.message).toBe("name is required");

      const minLength = ValidationError.minLength("password", 8);
      expect(minLength.field).toBe("password");
      expect(minLength.message).toBe("password must be at least 8 characters");

      const maxLength = ValidationError.maxLength("title", 100);
      expect(maxLength.field).toBe("title");
      expect(maxLength.message).toBe("title must be at most 100 characters");

      const minValue = ValidationError.minValue("age", 18);
      expect(minValue.field).toBe("age");
      expect(minValue.message).toBe("age must be at least 18");

      const maxValue = ValidationError.maxValue("quantity", 10);
      expect(maxValue.field).toBe("quantity");
      expect(maxValue.message).toBe("quantity must be at most 10");

      const invalidFormat = ValidationError.invalidFormat(
        "email",
        "email address",
      );
      expect(invalidFormat.field).toBe("email");
      expect(invalidFormat.message).toBe("email must be a valid email address");

      const invalidEnum = ValidationError.invalidEnum("status", [
        "active",
        "inactive",
      ]);
      expect(invalidEnum.field).toBe("status");
      expect(invalidEnum.message).toBe(
        "status must be one of: active, inactive",
      );
    });

    it("should work with Effect.catchTag", async () => {
      const effect = Effect.fail(ValidationError.required("name"));

      const recovered = effect.pipe(
        Effect.catchTag("ValidationError", (e) =>
          Effect.succeed(`Handled: ${e.field} - ${e.message}`),
        ),
      );

      const result = await Effect.runPromise(recovered);
      expect(result).toBe("Handled: name - name is required");
    });
  });

  describe("NotFoundError", () => {
    it("should create a not found error", () => {
      const error = new NotFoundError({ entityType: "User", id: "123" });
      expect(error._tag).toBe("NotFoundError");
      expect(error.entityType).toBe("User");
      expect(error.id).toBe("123");
      // Note: Data.TaggedError exposes properties directly, but the 'message'
      // from the schema is not automatically set as Error.message
      // The _tag allows pattern matching in Effect workflows
    });

    it("should support static factory method", () => {
      const error = NotFoundError.forEntity("Trip", "abc-123");
      expect(error.entityType).toBe("Trip");
      expect(error.id).toBe("abc-123");
    });
  });

  describe("StateTransitionError", () => {
    it("should create a state transition error", () => {
      const error = new StateTransitionError({
        from: "pending",
        to: "completed",
        entityType: "Order",
      });
      expect(error._tag).toBe("StateTransitionError");
      expect(error.from).toBe("pending");
      expect(error.to).toBe("completed");
      expect(error.entityType).toBe("Order");
      // Note: Data.TaggedError exposes properties directly from the schema
      // The _tag allows pattern matching in Effect workflows
    });

    it("should support static factory method", () => {
      const error = StateTransitionError.create("draft", "published", "Post");
      expect(error.from).toBe("draft");
      expect(error.to).toBe("published");
      expect(error.entityType).toBe("Post");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create an unauthorized error", () => {
      const error = new UnauthorizedError({
        message: "Access denied",
        operation: "delete",
        userId: "user-123",
      });
      expect(error._tag).toBe("UnauthorizedError");
      expect(error.message).toBe("Access denied");
      expect(error.operation).toBe("delete");
      expect(error.userId).toBe("user-123");
    });

    it("should support static factory methods", () => {
      const basic = UnauthorizedError.create("Not allowed");
      expect(basic.message).toBe("Not allowed");

      const forOp = UnauthorizedError.forOperation("adminAction", "user-1");
      expect(forOp.operation).toBe("adminAction");
      expect(forOp.userId).toBe("user-1");
      expect(forOp.message).toBe(
        "Not authorized to perform operation: adminAction",
      );
    });
  });

  describe("ConflictError", () => {
    it("should create a conflict error", () => {
      const error = new ConflictError({
        message: "Duplicate entry",
        field: "email",
        value: "test@example.com",
      });
      expect(error._tag).toBe("ConflictError");
      expect(error.field).toBe("email");
      expect(error.value).toBe("test@example.com");
    });

    it("should support static factory methods", () => {
      const basic = ConflictError.create("Something conflicted");
      expect(basic.message).toBe("Something conflicted");

      const duplicate = ConflictError.duplicate("username", "john");
      expect(duplicate.field).toBe("username");
      expect(duplicate.value).toBe("john");
      expect(duplicate.message).toBe("username 'john' already exists");
    });
  });

  describe("InvariantError", () => {
    it("should create an invariant error", () => {
      const error = new InvariantError({
        message: "Balance cannot be negative",
        invariant: "nonNegativeBalance",
      });
      expect(error._tag).toBe("InvariantError");
      expect(error.invariant).toBe("nonNegativeBalance");
    });

    it("should support static factory method", () => {
      const error = InvariantError.create("Something violated", "someRule");
      expect(error.invariant).toBe("someRule");
    });
  });

  describe("InvalidStateError", () => {
    it("should create an invalid state error", () => {
      const error = new InvalidStateError({
        message: "Operation not allowed in current state",
        currentState: "archived",
        requiredState: "active",
      });
      expect(error._tag).toBe("InvalidStateError");
      expect(error.currentState).toBe("archived");
      expect(error.requiredState).toBe("active");
    });

    it("should support static factory method", () => {
      const error = InvalidStateError.create("Bad state", "deleted", "active");
      expect(error.currentState).toBe("deleted");
      expect(error.requiredState).toBe("active");
    });
  });

  describe("ResourceUnavailableError", () => {
    it("should create a resource unavailable error", () => {
      const error = new ResourceUnavailableError({
        message: "Database connection failed",
        resourceType: "Database",
        resourceId: "primary",
      });
      expect(error._tag).toBe("ResourceUnavailableError");
      expect(error.resourceType).toBe("Database");
      expect(error.resourceId).toBe("primary");
    });

    it("should support static factory method", () => {
      const error = ResourceUnavailableError.create(
        "Service down",
        "API",
        "v1",
      );
      expect(error.resourceType).toBe("API");
      expect(error.resourceId).toBe("v1");
    });
  });

  describe("QuotaExceededError", () => {
    it("should create a quota exceeded error", () => {
      const error = new QuotaExceededError({
        message: "Rate limit exceeded",
        quota: "requestsPerMinute",
        current: 120,
        maximum: 100,
      });
      expect(error._tag).toBe("QuotaExceededError");
      expect(error.quota).toBe("requestsPerMinute");
      expect(error.current).toBe(120);
      expect(error.maximum).toBe(100);
    });

    it("should support static factory method", () => {
      const error = QuotaExceededError.create("Too many", "storage", 500, 400);
      expect(error.quota).toBe("storage");
      expect(error.current).toBe(500);
      expect(error.maximum).toBe(400);
    });
  });

  describe("Type guards", () => {
    it("should identify DomainErrors correctly", () => {
      const validationError = new ValidationError({ message: "Invalid" });
      const regularError = new Error("Regular");
      const plainObj = { _tag: "Something" };

      expect(isDomainError(validationError)).toBe(true);
      expect(isDomainError(regularError)).toBe(false);
      expect(isDomainError(plainObj)).toBe(false);
      expect(isDomainError(null)).toBe(false);
      expect(isDomainError(undefined)).toBe(false);
    });

    it("should identify specific error types", () => {
      const validation = new ValidationError({ message: "Invalid" });
      const notFound = new NotFoundError({ entityType: "User", id: "1" });
      const stateTransition = StateTransitionError.create("a", "b");
      const unauthorized = UnauthorizedError.create("No");
      const conflict = ConflictError.create("Conflict");
      const invariant = InvariantError.create("Broken", "rule");

      expect(isValidationError(validation)).toBe(true);
      expect(isValidationError(notFound)).toBe(false);

      expect(isNotFoundError(notFound)).toBe(true);
      expect(isNotFoundError(validation)).toBe(false);

      expect(isStateTransitionError(stateTransition)).toBe(true);
      expect(isStateTransitionError(validation)).toBe(false);

      expect(isUnauthorizedError(unauthorized)).toBe(true);
      expect(isUnauthorizedError(validation)).toBe(false);

      expect(isConflictError(conflict)).toBe(true);
      expect(isConflictError(validation)).toBe(false);

      expect(isInvariantError(invariant)).toBe(true);
      expect(isInvariantError(validation)).toBe(false);
    });
  });

  describe("Error utilities", () => {
    it("should get error message from ValidationError", () => {
      const error = new ValidationError({
        message: "Invalid email",
        field: "email",
      });
      // ValidationError schema includes message, so it should be accessible
      expect(error.message).toBe("Invalid email");
      expect(getDomainErrorCode(error)).toBe("ValidationError");
    });

    it("should get error code/tag", () => {
      const error = new NotFoundError({
        entityType: "User",
        id: "123",
      });
      expect(getDomainErrorCode(error)).toBe("NotFoundError");
      // Properties from schema are directly accessible
      expect(error.entityType).toBe("User");
      expect(error.id).toBe("123");
    });
  });

  describe("Effect integration", () => {
    it("should work with Effect.fail and pattern matching", async () => {
      const errors: DomainError[] = [
        new ValidationError({ message: "Invalid" }),
        new NotFoundError({ entityType: "User", id: "1" }),
        new UnauthorizedError({ message: "No access" }),
      ];

      for (const error of errors) {
        const effect = Effect.fail(error);
        const handled = effect.pipe(
          Effect.catchTag(error._tag, (e: DomainError) =>
            Effect.succeed(`Caught: ${e._tag}`),
          ),
        );
        const result = await Effect.runPromise(handled);
        expect(result).toBe(`Caught: ${error._tag}`);
      }
    });

    it("should support exhaustive error handling", async () => {
      type AppError = ValidationError | NotFoundError | UnauthorizedError;

      const handleError = (error: AppError): string => {
        switch (error._tag) {
          case "ValidationError":
            return `Validation failed: ${error.field || "unknown"}`;
          case "NotFoundError":
            return `Not found: ${error.entityType}`;
          case "UnauthorizedError":
            return `Unauthorized: ${error.operation || "unknown operation"}`;
          default:
            return "Unknown error";
        }
      };

      const validation = new ValidationError({
        message: "Bad",
        field: "email",
      });
      const notFound = NotFoundError.forEntity("User", "123");
      const unauthorized = UnauthorizedError.forOperation("delete", "user-1");

      expect(handleError(validation)).toBe("Validation failed: email");
      expect(handleError(notFound)).toBe("Not found: User");
      expect(handleError(unauthorized)).toBe("Unauthorized: delete");
    });
  });
});
