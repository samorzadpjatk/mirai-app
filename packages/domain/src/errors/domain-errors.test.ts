import { describe, it, expect } from "bun:test";
import {
  DomainError,
  ValidationError,
  StateTransitionError,
  NotFoundError,
  isDomainError,
  isValidationError,
  isStateTransitionError,
  isNotFoundError,
} from "./unified-errors";

describe("[UNIT] domain-errors", () => {
  describe("[UNIT] DomainError (base class)", () => {
    it("has _tag property", () => {
      const error = new DomainError("test message", "TestTag");

      expect(error._tag).toBe("TestTag");
      expect(error.name).toBe("TestTag");
      expect(error.message).toBe("test message");
    });

    it("extends Error correctly with stack trace", () => {
      const error = new DomainError("test", "TestTag");

      expect(error).toBeInstanceOf(Error);
      expect(error.stack).toBeDefined();
    });
  });

  describe("[UNIT] ValidationError", () => {
    it("includes field when provided", () => {
      const error = new ValidationError("Name is required", "name");

      expect(error._tag).toBe("ValidationError");
      expect(error.field).toBe("name");
      expect(error.message).toBe("Name is required");
    });

    it("allows undefined field", () => {
      const error = new ValidationError("Validation failed");

      expect(error.field).toBeUndefined();
      expect(error.message).toBe("Validation failed");
    });

    it("creates error with forField factory", () => {
      const error = ValidationError.forField("email", "Invalid format");

      expect(error.field).toBe("email");
      expect(error.message).toBe("email: Invalid format");
    });

    it("creates required error", () => {
      const error = ValidationError.required("username");

      expect(error.field).toBe("username");
      expect(error.message).toBe("username is required");
    });

    it("creates minLength error", () => {
      const error = ValidationError.minLength("password", 8);

      expect(error.field).toBe("password");
      expect(error.message).toBe("password must be at least 8 characters");
    });

    it("creates maxLength error", () => {
      const error = ValidationError.maxLength("title", 100);

      expect(error.field).toBe("title");
      expect(error.message).toBe("title must be at most 100 characters");
    });

    it("creates minValue error", () => {
      const error = ValidationError.minValue("age", 18);

      expect(error.field).toBe("age");
      expect(error.message).toBe("age must be at least 18");
    });

    it("creates maxValue error", () => {
      const error = ValidationError.maxValue("score", 100);

      expect(error.field).toBe("score");
      expect(error.message).toBe("score must be at most 100");
    });

    it("creates invalidFormat error", () => {
      const error = ValidationError.invalidFormat("email", "email address");

      expect(error.field).toBe("email");
      expect(error.message).toBe("email must be a valid email address");
    });

    it("extends DomainError", () => {
      const error = new ValidationError("test", "field");

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("[UNIT] StateTransitionError", () => {
    it("stores from and to states", () => {
      const error = new StateTransitionError("DRAFT", "COMPLETED");

      expect(error._tag).toBe("StateTransitionError");
      expect(error.from).toBe("DRAFT");
      expect(error.to).toBe("COMPLETED");
      expect(error.message).toContain("DRAFT");
      expect(error.message).toContain("COMPLETED");
    });

    it("extends DomainError", () => {
      const error = new StateTransitionError("A", "B");

      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("[UNIT] NotFoundError", () => {
    it("includes entityType and id", () => {
      const error = new NotFoundError("User", "user-123");

      expect(error._tag).toBe("NotFoundError");
      expect(error.entityType).toBe("User");
      expect(error.id).toBe("user-123");
      expect(error.message).toContain("User");
      expect(error.message).toContain("user-123");
    });

    it("works with different entity types", () => {
      const challengeError = new NotFoundError("Challenge", "challenge-456");
      const tripError = new NotFoundError("Trip", "trip-789");

      expect(challengeError.entityType).toBe("Challenge");
      expect(tripError.entityType).toBe("Trip");
    });

    it("extends DomainError", () => {
      const error = new NotFoundError("Entity", "id");

      expect(error).toBeInstanceOf(DomainError);
    });
  });

  describe("[UNIT] Type guards", () => {
    describe("[UNIT] isDomainError", () => {
      it("returns true for DomainError instances", () => {
        const error = new DomainError("test", "TestTag");

        expect(isDomainError(error)).toBe(true);
      });

      it("returns true for ValidationError", () => {
        const error = new ValidationError("test");

        expect(isDomainError(error)).toBe(true);
      });

      it("returns true for StateTransitionError", () => {
        const error = new StateTransitionError("A", "B");

        expect(isDomainError(error)).toBe(true);
      });

      it("returns true for NotFoundError", () => {
        const error = new NotFoundError("User", "123");

        expect(isDomainError(error)).toBe(true);
      });

      it("returns false for plain Error", () => {
        const error = new Error("test");

        expect(isDomainError(error)).toBe(false);
      });

      it("returns false for non-error values", () => {
        expect(isDomainError(null)).toBe(false);
        expect(isDomainError(undefined)).toBe(false);
        expect(isDomainError("string")).toBe(false);
        expect(isDomainError(123)).toBe(false);
        expect(isDomainError({})).toBe(false);
      });
    });

    describe("[UNIT] isValidationError", () => {
      it("returns true for ValidationError", () => {
        const error = new ValidationError("test");

        expect(isValidationError(error)).toBe(true);
      });

      it("returns false for other errors", () => {
        expect(isValidationError(new StateTransitionError("A", "B"))).toBe(
          false,
        );
        expect(isValidationError(new NotFoundError("User", "123"))).toBe(false);
        expect(isValidationError(new Error("test"))).toBe(false);
      });
    });

    describe("[UNIT] isStateTransitionError", () => {
      it("returns true for StateTransitionError", () => {
        const error = new StateTransitionError("A", "B");

        expect(isStateTransitionError(error)).toBe(true);
      });

      it("returns false for other errors", () => {
        expect(isStateTransitionError(new ValidationError("test"))).toBe(false);
        expect(isStateTransitionError(new NotFoundError("User", "123"))).toBe(
          false,
        );
        expect(isStateTransitionError(new Error("test"))).toBe(false);
      });
    });

    describe("[UNIT] isNotFoundError", () => {
      it("returns true for NotFoundError", () => {
        const error = new NotFoundError("User", "123");

        expect(isNotFoundError(error)).toBe(true);
      });

      it("returns false for other errors", () => {
        expect(isNotFoundError(new ValidationError("test"))).toBe(false);
        expect(isNotFoundError(new StateTransitionError("A", "B"))).toBe(false);
        expect(isNotFoundError(new Error("test"))).toBe(false);
      });
    });
  });
});
