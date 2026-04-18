import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import type {
  IAuthPort,
  AccessCheckRequest,
  ResourceType,
  PermissionLevel,
  TripRole,
} from "./index";
import {
  sanitizeAccessCheckRequest,
  accessCheckRequestToString,
} from "./index";
import type { Role } from "../../user/entities/User";
import { DatabaseError } from "../errors/domain-errors";

describe("[UNIT] IAuthPort Interface Contract", () => {
  /**
   * Mock implementation of IAuthPort for contract testing.
   * This verifies the interface can be properly implemented.
   */
  const createMockAuthPort = (): IAuthPort => ({
    signInWithPassword: (email: string, password: string) =>
      Effect.succeed({
        user: { id: "user-123", email },
        session: { accessToken: "token-123" },
      }),

    signInWithOtp: (email: string, _otp: string) =>
      Effect.succeed({
        user: { id: "user-123", email },
        session: { accessToken: "token-123" },
      }),

    sendSignInOtp: (_email: string) => Effect.succeed(void 0),

    signUp: (email: string, _password: string) =>
      Effect.succeed({ user: { id: "user-123", email } }),

    signOut: () => Effect.succeed(void 0),

    getSession: () =>
      Effect.succeed({
        user: { id: "user-123", email: "test@example.com" },
        accessToken: "token-123",
      }),

    refreshSession: () =>
      Effect.succeed({ session: { accessToken: "new-token-123" } }),

    verifyAccess: (_request: AccessCheckRequest) => Effect.succeed(void 0),
  });

  describe("sendSignInOtp method", () => {
    it("should return Effect<void, IPortError, never>", async () => {
      const mockPort = createMockAuthPort();
      const result = await Effect.runPromise(
        Effect.either(mockPort.sendSignInOtp("test@example.com")),
      );

      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right).toBeUndefined();
      }
    });

    it("should fail with IPortError on error", async () => {
      const failingPort: IAuthPort = {
        ...createMockAuthPort(),
        sendSignInOtp: (_email: string) =>
          Effect.fail(
            new DatabaseError({
              operation: "sendSignInOtp",
              cause: new Error("SMTP failed"),
            }),
          ),
      };

      const result = await Effect.runPromise(
        Effect.either(failingPort.sendSignInOtp("test@example.com")),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("DatabaseError");
      }
    });
  });

  describe("verifyAccess method", () => {
    const validRequest: AccessCheckRequest = {
      userId: "user-123",
      role: "USER" as Role,
      tripRoles: {},
      resourceType: "trip" as ResourceType,
      resourceId: "trip-123",
      requiredPermission: "read" as PermissionLevel,
    };

    it("should return Effect<void, IPortError, never> on success", async () => {
      const mockPort = createMockAuthPort();
      const result = await Effect.runPromise(
        Effect.either(mockPort.verifyAccess(validRequest)),
      );

      expect(Either.isRight(result)).toBe(true);
      if (Either.isRight(result)) {
        expect(result.right).toBeUndefined();
      }
    });

    it("should fail with IPortError when access denied", async () => {
      const denyingPort: IAuthPort = {
        ...createMockAuthPort(),
        verifyAccess: (_request: AccessCheckRequest) =>
          Effect.fail(
            new DatabaseError({
              operation: "verifyAccess",
              cause: new Error("Access denied"),
            }),
          ),
      };

      const result = await Effect.runPromise(
        Effect.either(denyingPort.verifyAccess(validRequest)),
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("DatabaseError");
      }
    });

    it("should handle all resource types", async () => {
      const resourceTypes: ResourceType[] = [
        "trip",
        "group",
        "challenge",
        "user",
        "activity",
        "notification",
        "reward",
        "sponsor",
        "coin",
        "challengeSubmission",
      ];

      const mockPort = createMockAuthPort();

      for (const resourceType of resourceTypes) {
        const request: AccessCheckRequest = {
          ...validRequest,
          resourceType,
        };

        const result = await Effect.runPromise(
          Effect.either(mockPort.verifyAccess(request)),
        );

        expect(Either.isRight(result)).toBe(true);
      }
    });

    it("should handle all permission levels", async () => {
      const permissionLevels: PermissionLevel[] = ["read", "write", "admin"];

      const mockPort = createMockAuthPort();

      for (const requiredPermission of permissionLevels) {
        const request: AccessCheckRequest = {
          ...validRequest,
          requiredPermission,
        };

        const result = await Effect.runPromise(
          Effect.either(mockPort.verifyAccess(request)),
        );

        expect(Either.isRight(result)).toBe(true);
      }
    });

    it("should handle trip roles in request", async () => {
      const requestWithTripRoles: AccessCheckRequest = {
        ...validRequest,
        tripRoles: {
          "trip-123": "LEADER" as TripRole,
          "trip-456": "MEMBER" as TripRole,
        },
      };

      const mockPort = createMockAuthPort();
      const result = await Effect.runPromise(
        Effect.either(mockPort.verifyAccess(requestWithTripRoles)),
      );

      expect(Either.isRight(result)).toBe(true);
    });

    it("should handle requireOwnership flag", async () => {
      const requestWithOwnership: AccessCheckRequest = {
        ...validRequest,
        requireOwnership: true,
      };

      const mockPort = createMockAuthPort();
      const result = await Effect.runPromise(
        Effect.either(mockPort.verifyAccess(requestWithOwnership)),
      );

      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("AccessCheckRequest type", () => {
    it("should allow construction with all required fields", () => {
      const request: AccessCheckRequest = {
        userId: "user-123",
        role: "ADMIN" as Role,
        tripRoles: {
          "trip-123": "LEADER" as TripRole,
        },
        resourceType: "trip" as ResourceType,
        resourceId: "trip-123",
        requiredPermission: "admin" as PermissionLevel,
      };

      expect(request.userId).toBe("user-123");
      expect(request.role).toBe("ADMIN");
      expect(request.resourceType).toBe("trip");
      expect(request.resourceId).toBe("trip-123");
      expect(request.requiredPermission).toBe("admin");
    });

    it("should allow optional requireOwnership field", () => {
      const request: AccessCheckRequest = {
        userId: "user-123",
        role: "USER" as Role,
        tripRoles: {},
        resourceType: "group" as ResourceType,
        resourceId: "group-123",
        requiredPermission: "write" as PermissionLevel,
        requireOwnership: true,
      };

      expect(request.requireOwnership).toBe(true);
    });
  });

  describe("existing IAuthPort methods", () => {
    const mockPort = createMockAuthPort();

    it("should maintain signInWithPassword contract", async () => {
      const result = await Effect.runPromise(
        mockPort.signInWithPassword("test@example.com", "password123"),
      );

      expect(result.user.id).toBe("user-123");
      expect(result.user.email).toBe("test@example.com");
      expect(result.session.accessToken).toBe("token-123");
    });

    it("should maintain signInWithOtp contract", async () => {
      const result = await Effect.runPromise(
        mockPort.signInWithOtp("test@example.com", "123456"),
      );

      expect(result.user.email).toBe("test@example.com");
      expect(result.session.accessToken).toBe("token-123");
    });

    it("should maintain signUp contract", async () => {
      const result = await Effect.runPromise(
        mockPort.signUp("new@example.com", "password123"),
      );

      expect(result.user).not.toBeNull();
      expect(result.user?.email).toBe("new@example.com");
    });

    it("should maintain signOut contract", async () => {
      const result = await Effect.runPromise(mockPort.signOut());
      expect(result).toBeUndefined();
    });

    it("should maintain getSession contract", async () => {
      const result = await Effect.runPromise(mockPort.getSession());

      expect(result.user).not.toBeNull();
      expect(result.accessToken).toBe("token-123");
    });

    it("should maintain refreshSession contract", async () => {
      const result = await Effect.runPromise(mockPort.refreshSession());

      expect(result.session).not.toBeNull();
      expect(result.session?.accessToken).toBe("new-token-123");
    });
  });

  describe("sanitizeAccessCheckRequest helper", () => {
    it("should return a safe copy of AccessCheckRequest", () => {
      const request: AccessCheckRequest = {
        userId: "user-123",
        role: "USER" as Role,
        tripRoles: { "trip-123": "MEMBER" as TripRole },
        resourceType: "trip" as ResourceType,
        resourceId: "trip-123",
        requiredPermission: "read" as PermissionLevel,
      };

      const sanitized = sanitizeAccessCheckRequest(request);

      expect(sanitized).toEqual(request);
      // Should be a new object (not same reference)
      expect(sanitized).not.toBe(request);
    });
  });

  describe("accessCheckRequestToString helper", () => {
    it("should create safe string representation without requireOwnership", () => {
      const request: AccessCheckRequest = {
        userId: "user-123",
        role: "USER" as Role,
        tripRoles: {},
        resourceType: "trip" as ResourceType,
        resourceId: "trip-123",
        requiredPermission: "read" as PermissionLevel,
      };

      const str = accessCheckRequestToString(request);

      expect(str).toContain("userId:user-123");
      expect(str).toContain("role:USER");
      expect(str).toContain("resourceType:trip");
      expect(str).toContain("resourceId:trip-123");
      expect(str).toContain("requiredPermission:read");
      expect(str).not.toContain("requireOwnership");
    });

    it("should include requireOwnership when present", () => {
      const request: AccessCheckRequest = {
        userId: "user-123",
        role: "ADMIN" as Role,
        tripRoles: {},
        resourceType: "user" as ResourceType,
        resourceId: "user-456",
        requiredPermission: "admin" as PermissionLevel,
        requireOwnership: true,
      };

      const str = accessCheckRequestToString(request);

      expect(str).toContain("requireOwnership:true");
    });
  });
});
