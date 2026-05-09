import { describe, it, expect } from "vitest";
import { parseUsersCsv } from "../users";

describe("users", () => {
  describe("parseUsersCsv", () => {
    it("should parse basic CSV with headers", () => {
      const csv = `email,firstName,lastName
john@example.com,John,Doe
jane@example.com,Jane,Smith`;

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      });
      expect(result[1]).toEqual({
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
      });
    });

    it("should parse CSV with role column", () => {
      const csv = `email,firstName,lastName,role
admin@example.com,Admin,User,admin
user@example.com,Regular,User,user`;

      const result = parseUsersCsv(csv);

      expect(result[0]!.role).toBe("admin");
      expect(result[1]!.role).toBe("user");
    });

    it("should trim whitespace from values", () => {
      const csv = `email,firstName,lastName
  john@example.com  ,  John  ,  Doe  `;

      const result = parseUsersCsv(csv);

      expect(result[0]).toEqual({
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should skip empty lines", () => {
      const csv = `email,firstName,lastName
john@example.com,John,Doe

jane@example.com,Jane,Smith

`;

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(2);
    });

    it("should handle single user", () => {
      const csv = `email,firstName,lastName
solo@example.com,Solo,User`;

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]!.email).toBe("solo@example.com");
    });

    it("should handle empty CSV (only headers)", () => {
      const csv = `email,firstName,lastName`;

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(0);
    });

    it("should handle CSV with many columns", () => {
      const csv = `email,firstName,lastName,role,password,ghost,wristNumber,houseNumber
test@example.com,Test,User,admin,secret,true,123,5`;

      const result = parseUsersCsv(csv);

      expect(result[0]).toEqual({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        password: "secret",
        ghost: "true",
        wristNumber: "123",
        houseNumber: "5",
      });
    });

    it("should handle emails with special characters", () => {
      const csv = `email,firstName,lastName
user+tag@example.com,Tagged,User
user.name@example.co.uk,UK,User`;

      const result = parseUsersCsv(csv);

      expect(result[0]!.email).toBe("user+tag@example.com");
      expect(result[1]!.email).toBe("user.name@example.co.uk");
    });

    it("should handle names with spaces", () => {
      const csv = `email,firstName,lastName
john@example.com,John Paul,Doe Smith`;

      const result = parseUsersCsv(csv);

      expect(result[0]!.firstName).toBe("John Paul");
      expect(result[0]!.lastName).toBe("Doe Smith");
    });

    it("should handle unicode characters", () => {
      const csv = `email,firstName,lastName
josé@example.com,José,García
用户@example.com,用户,名称`;

      const result = parseUsersCsv(csv);

      expect(result[0]!.firstName).toBe("José");
      expect(result[0]!.lastName).toBe("García");
      expect(result[1]!.email).toBe("用户@example.com");
    });

    it("should handle empty values", () => {
      const csv = `email,firstName,lastName,role
partial@example.com,,,user`;

      const result = parseUsersCsv(csv);

      expect(result[0]!.email).toBe("partial@example.com");
      expect(result[0]!.firstName).toBe("");
      expect(result[0]!.lastName).toBe("");
      expect(result[0]!.role).toBe("user");
    });

    it("should handle Windows line endings", () => {
      const csv = `email,firstName,lastName\r\nwin@example.com,Windows,User\r\n`;

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]!.email).toBe("win@example.com");
    });

    it("should handle many users", () => {
      const lines = ["email,firstName,lastName"];
      for (let i = 0; i < 100; i++) {
        lines.push(`user${i}@example.com,User${i},Last${i}`);
      }
      const csv = lines.join("\n");

      const result = parseUsersCsv(csv);

      expect(result).toHaveLength(100);
      expect(result[50]!.email).toBe("user50@example.com");
    });
  });
});
