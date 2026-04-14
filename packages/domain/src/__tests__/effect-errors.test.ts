/**
 * Unit Tests for Unified Domain Errors
 *
 * @module unified-errors.test
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
  type DomainErrors,
} from "../errors";

describe("[UNIT] unified-errors", () => {
  describe("[UNIT] ValidationError", () => {
    it("should create a basic validation error (unified pattern)", () => {
      const error = new ValidationError("Invalid input");
      expect(error._tag).toBe("ValidationError");
      expect(error.message).toBe("Invalid input");
      expect(error.field).toBeUndefined();
    });

    it("should create a validation error with field (unified pattern)", () => {
      const error = new ValidationError("Name is required", "name");
      expect(error.field).toBe("name");
      expect(error.message).toBe("Name is required");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new ValidationError({
        message: "Invalid email",
        field: "email",
      });
      expect(error._tag).toBe("ValidationError");
      expect(error.message).toBe("Invalid email");
      expect(error.field).toBe("email");
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

  describe("[UNIT] NotFoundError", () => {
    it("should create a not found error (unified pattern)", () => {
      const error = new NotFoundError("User", "123");
      expect(error._tag).toBe("NotFoundError");
      expect(error.entityType).toBe("User");
      expect(error.id).toBe("123");
      expect(error.message).toBe("User with id '123' not found");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new NotFoundError({ entityType: "Trip", id: "abc-123" });
      expect(error._tag).toBe("NotFoundError");
      expect(error.entityType).toBe("Trip");
      expect(error.id).toBe("abc-123");
    });

    it("should support static factory method", () => {
      const error = NotFoundError.forEntity("Trip", "abc-123");
      expect(error.entityType).toBe("Trip");
      expect(error.id).toBe("abc-123");
    });
  });

  describe("[UNIT] StateTransitionError", () => {
    it("should create a state transition error (unified pattern)", () => {
      const error = new StateTransitionError("pending", "completed", "Order");
      expect(error._tag).toBe("StateTransitionError");
      expect(error.from).toBe("pending");
      expect(error.to).toBe("completed");
      expect(error.entityType).toBe("Order");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new StateTransitionError({
        from: "draft",
        to: "published",
        entityType: "Post",
      });
      expect(error._tag).toBe("StateTransitionError");
      expect(error.from).toBe("draft");
      expect(error.to).toBe("published");
      expect(error.entityType).toBe("Post");
    });

    it("should support static factory method", () => {
      const error = StateTransitionError.create("draft", "published", "Post");
      expect(error.from).toBe("draft");
      expect(error.to).toBe("published");
      expect(error.entityType).toBe("Post");
    });
  });

  describe("[UNIT] UnauthorizedError", () => {
    it("should create an unauthorized error (unified pattern)", () => {
      const error = new UnauthorizedError(
        "Access denied",
        "delete",
        "user-123",
      );
      expect(error._tag).toBe("UnauthorizedError");
      expect(error.message).toBe("Access denied");
      expect(error.operation).toBe("delete");
      expect(error.userId).toBe("user-123");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new UnauthorizedError({
        message: "No access",
        operation: "adminAction",
        userId: "user-1",
      });
      expect(error._tag).toBe("UnauthorizedError");
      expect(error.message).toBe("No access");
      expect(error.operation).toBe("adminAction");
      expect(error.userId).toBe("user-1");
    });

    it("should support static factory method forOperation", () => {
      const error = UnauthorizedError.forOperation("adminAction", "user-1");
      expect(error.operation).toBe("adminAction");
      expect(error.userId).toBe("user-1");
      expect(error.message).toBe("Not authorized to perform: adminAction");
    });
  });

  describe("[UNIT] ConflictError", () => {
    it("should create a conflict error (unified pattern)", () => {
      const error = new ConflictError(
        "Duplicate entry",
        "email",
        "test@example.com",
      );
      expect(error._tag).toBe("ConflictError");
      expect(error.message).toBe("Duplicate entry");
      expect(error.field).toBe("email");
      expect(error.value).toBe("test@example.com");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new ConflictError({
        message: "Username taken",
        field: "username",
        value: "john",
      });
      expect(error._tag).toBe("ConflictError");
      expect(error.message).toBe("Username taken");
      expect(error.field).toBe("username");
      expect(error.value).toBe("john");
    });

    it("should support static factory methods", () => {
      const basic = new ConflictError("Something conflicted");
      expect(basic.message).toBe("Something conflicted");

      const duplicate = ConflictError.duplicate("username", "john");
      expect(duplicate.field).toBe("username");
      expect(duplicate.value).toBe("john");
      expect(duplicate.message).toBe("username 'john' already exists");
    });
  });

  describe("[UNIT] InvariantError", () => {
    it("should create an invariant error (unified pattern)", () => {
      const error = new InvariantError(
        "Balance cannot be negative",
        "nonNegativeBalance",
      );
      expect(error._tag).toBe("InvariantError");
      expect(error.invariant).toBe("nonNegativeBalance");
      expect(error.constraint).toBe("nonNegativeBalance");
    });

    it("should support Effect pattern for backward compatibility", () => {
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

  describe("[UNIT] InvalidStateError", () => {
    it("should create an invalid state error (unified pattern)", () => {
      const error = InvalidStateError.create("archived", "active", "Document");
      expect(error._tag).toBe("InvalidStateError");
      expect(error.currentState).toBe("archived");
      expect(error.requiredState).toBe("active");
      expect(error.entityType).toBe("Document");
    });

    it("should support Effect pattern for backward compatibility", () => {
      const error = new InvalidStateError({
        message: "Operation not allowed in current state",
        currentState: "archived",
        requiredState: "active",
      });
      expect(error._tag).toBe("InvalidStateError");
      expect(error.currentState).toBe("archived");
      expect(error.requiredState).toBe("active");
    });
  });

  describe("[UNIT] ResourceUnavailableError", () => {
    it("should create a resource unavailable error (unified pattern)", () => {
      const error = new ResourceUnavailableError(
        "Service unavailable: Database connection failed",
        "Database",
        "primary",
      );
      expect(error._tag).toBe("ResourceUnavailableError");
      expect(error.resourceType).toBe("Database");
      expect(error.resourceId).toBe("primary");
    });

    it("should support Effect pattern for backward compatibility", () => {
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

  describe("[UNIT] QuotaExceededError", () => {
    it("should create a quota exceeded error (unified pattern)", () => {
      const error = QuotaExceededError.create(
        "Rate limit exceeded",
        "requestsPerMinute",
        120,
        100,
      );
      expect(error._tag).toBe("QuotaExceededError");
      expect(error.quota).toBe("requestsPerMinute");
      expect(error.current).toBe(120);
      expect(error.maximum).toBe(100);
    });

    it("should support Effect pattern for backward compatibility", () => {
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
  });

  describe("[UNIT] Type guards", () => {
    it("should identify DomainErrors correctly", () => {
      const validationError = new ValidationError("Invalid");
      const regularError = new Error("Regular");

      expect(isDomainError(validationError)).toBe(true);
      expect(isDomainError(regularError)).toBe(false);
      expect(isDomainError(null)).toBe(false);
      expect(isDomainError(undefined)).toBe(false);
    });

    it("should identify specific error types", () => {
      const validation = new ValidationError("Invalid");
      const notFound = new NotFoundError("User", "1");
      const stateTransition = StateTransitionError.create("a", "b");
      const unauthorized = new UnauthorizedError("No");
      const conflict = new ConflictError("Conflict");
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

  describe("[UNIT] Error utilities", () => {
    it("should get error message from ValidationError", () => {
      const error = new ValidationError("Invalid email", "email");
      expect(error.message).toBe("Invalid email");
      // Unified errors use 'code' property (e.g., VALIDATION_FAILED)
      expect(getDomainErrorCode(error)).toBe("VALIDATION_FAILED");
    });

    it("should get error code/tag", () => {
      const error = new NotFoundError("User", "123");
      // Unified errors use 'code' property (e.g., NOT_FOUND)
      expect(getDomainErrorCode(error)).toBe("NOT_FOUND");
      // Properties are directly accessible
      expect(error.entityType).toBe("User");
      expect(error.id).toBe("123");
    });

    it("should get error message utility", () => {
      const error = new ValidationError("Field required", "name");
      expect(getDomainErrorMessage(error)).toBe("Field required");
    });
  });

  describe("[INTEGRATION] Effect integration", () => {
    it("should work with Effect.fail and pattern matching", async () => {
      const errors: DomainErrors[] = [
        new ValidationError("Invalid"),
        new NotFoundError("User", "1"),
        new UnauthorizedError("No access"),
      ];

      for (const error of errors) {
        const effect = Effect.fail(error);
        const handled = effect.pipe(
          Effect.catchTag(error._tag, (e: DomainErrors) =>
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

      const validation = new ValidationError("Bad", "email");
      const notFound = NotFoundError.forEntity("User", "123");
      const unauthorized = UnauthorizedError.forOperation("delete", "user-1");

      expect(handleError(validation)).toBe("Validation failed: email");
      expect(handleError(notFound)).toBe("Not found: User");
      expect(handleError(unauthorized)).toBe("Unauthorized: delete");
    });
  });
});
