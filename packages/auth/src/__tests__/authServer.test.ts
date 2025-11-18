import {
  parseRolesFromToken,
  hasRequiredRole,
  mapDatabaseUserToAuthUser,
} from "../authServer";
import type { User } from "@integral-2025-app/common-types";

describe("auth server", () => {
  describe("parseRolesFromToken", () => {
    it("should parse roles from valid JWT", () => {
      const payload = { groups: ["admin", "users"] };
      const base64Payload = btoa(JSON.stringify(payload));
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
      const dbUser: User = {
        id: "1",
        supabaseUserId: "sub-1",
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
        coinBalance: 100,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const authUser = mapDatabaseUserToAuthUser(dbUser);

      expect(authUser).toEqual({
        id: "1",
        supabaseUserId: "sub-1",
        email: "user@test.com",
        name: "User",
        emailVerified: new Date("2024-01-01"),
      });
    });

    it("should return null for null input", () => {
      expect(mapDatabaseUserToAuthUser(null)).toBeNull();
    });

    it("should return null if supabaseUserId is missing", () => {
      const dbUser: User = {
        id: "1",
        supabaseUserId: null,
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
        coinBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mapDatabaseUserToAuthUser(dbUser)).toBeNull();
    });
  });
});
