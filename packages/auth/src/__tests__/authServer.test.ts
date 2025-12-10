import { describe, it, expect, vi } from "vitest";
import { Buffer } from "node:buffer";
import {
  parseRolesFromToken,
  hasRequiredRole,
  mapDatabaseUserToAuthUser,
  getAuthServerUser,
  getAuthServerSession,
  AuthenticationError,
  AuthorizationError,
} from "../authServer";
import type { SupabaseClient } from "@integral-2025-app/supabase";

const mockSupabaseClient = () => {
  return {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  } as unknown as SupabaseClient;
};

const encodePayload = (payload: unknown) =>
  Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

describe("auth server", () => {
  describe("AuthenticationError", () => {
    it("should create error with default message", () => {
      const error = new AuthenticationError();
      expect(error.message).toBe("Not Authenticated");
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create error with custom message", () => {
      const error = new AuthenticationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
    });
  });

  describe("AuthorizationError", () => {
    it("should create error with default message", () => {
      const error = new AuthorizationError();
      expect(error.message).toBe("Missing Required Permissions");
      expect(error.name).toBe("AuthorizationError");
    });

    it("should create error with custom message", () => {
      const error = new AuthorizationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
    });
  });

  describe("getAuthServerUser", () => {
    it("should return user when successful", async () => {
      const client = mockSupabaseClient();
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        created_at: "2024-01-01",
      };
  (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const user = await getAuthServerUser(client);
      expect(user).toEqual(mockUser);
    });

    it("should forward access token when provided", async () => {
      const client = mockSupabaseClient();
      const mockUser = { id: "user-123" } as any;
      (client.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const token = "test-token";
      const user = await getAuthServerUser(client, token);

      expect(user).toEqual(mockUser);
      expect(client.auth.getUser).toHaveBeenCalledWith(token);
    });

    it("should return null on error", async () => {
      const client = mockSupabaseClient();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

  (client.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: new Error("Auth error"),
      });

      const user = await getAuthServerUser(client);
      expect(user).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error occurred while fetching user:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getAuthServerSession", () => {
    it("should return session when successful", async () => {
      const client = mockSupabaseClient();
      const mockSession = {
        access_token: "token",
        refresh_token: "refresh",
        user: { id: "user-123" },
      };
  (client.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getAuthServerSession(client);
      expect(session).toEqual(mockSession);
    });

    it("should build session from bearer token", async () => {
      const client = mockSupabaseClient();
      const mockUser = { id: "user-123" } as any;
      (client.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const session = await getAuthServerSession(client, "jwt-token");

      expect(session).toMatchObject({
        user: mockUser,
        authUserId: mockUser.id,
        access_token: "jwt-token",
        token_type: "bearer",
      });
      expect(client.auth.getUser).toHaveBeenCalledWith("jwt-token");
    });

    it("should return null on error", async () => {
      const client = mockSupabaseClient();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

  (client.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: null },
        error: new Error("Session error"),
      });

      const session = await getAuthServerSession(client);
      expect(session).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error occurred while fetching session:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });
  describe("parseRolesFromToken", () => {
    it("should parse roles from valid JWT", () => {
      const payload = { groups: ["admin", "users"] };
      const base64Payload = encodePayload(payload);
      const token = `header.${base64Payload}.signature`;

      const roles = parseRolesFromToken(token);
      expect(roles).toEqual(["admin", "users"]);
    });

    it("should return empty array for invalid token", () => {
      const roles = parseRolesFromToken("invalid-token");
      expect(roles).toEqual([]);
    });

    it("should return empty array for undefined token", () => {
      const roles = parseRolesFromToken(undefined);
      expect(roles).toEqual([]);
    });
  });

  describe("hasRequiredRole", () => {
    it("should return true if role is in groups", () => {
      const groups = ["admin", "users"];
      expect(hasRequiredRole(groups, "admin")).toBe(true);
    });

    it("should return false if role is not in groups", () => {
      const groups = ["users"];
      expect(hasRequiredRole(groups, "admin")).toBe(false);
    });
  });

  describe("mapDatabaseUserToAuthUser", () => {
    it("should map database user to auth user with only auth-relevant fields", () => {
      const dbUser = {
        id: "1",
        authUserId: "sub-1",
        email: "user@test.com",
        name: "User",
        image: "https://example.com/avatar.jpg",
        wristNumber: "123",
        houseNumber: "456",
        isAdmin: true,
        isModerator: false,
        isServiceAccount: false,
        groupId: "group-1",
        emailVerified: new Date("2024-01-01"),
      };

      const authUser = mapDatabaseUserToAuthUser(dbUser);

      expect(authUser).toEqual({
        id: "1",
        authUserId: "sub-1",
        email: "user@test.com",
        name: "User",
        emailVerified: new Date("2024-01-01"),
      });
    });

    it("should return null for null input", () => {
      expect(mapDatabaseUserToAuthUser(null)).toBeNull();
    });

    it("should return null if authUserId is missing", () => {
      const dbUser = {
        id: "1",
        authUserId: null,
        email: "user@test.com",
        name: "User",
        image: null,
        wristNumber: null,
        houseNumber: null,
        isAdmin: false,
        isModerator: false,
        isServiceAccount: false,
        groupId: null,
        emailVerified: null,
      };

      expect(mapDatabaseUserToAuthUser(dbUser)).toBeNull();
    });
  });
});
