import { describe, it, expect } from "bun:test";
import {
  ServiceError,
  DatabaseConnectionError,
  DatabaseTransactionError,
  ExternalAPIError,
  ExternalAPITimeoutError,
  StorageError,
  StorageFileNotFoundError,
  MappingError,
  ConfigurationError,
  isAdapterError,
  getAdapterErrorMessage,
  getAdapterErrorCode,
} from "./adapter-errors";
import { DatabaseError } from "@mirai-app/domain";

describe("[UNIT] AdapterErrors", () => {
  describe("ServiceError", () => {
    it("creates error with correct properties", () => {
      const error = new ServiceError({
        operation: "sendNotification",
        message: "Failed to send push notification",
        cause: new Error("Network timeout"),
      });

      expect(error._tag).toBe("ServiceError");
      expect(error.code).toBe("SERVICE_ERROR");
      expect(error.operation).toBe("sendNotification");
      expect(error.message).toBe("Failed to send push notification");
      expect(error.cause).toBeInstanceOf(Error);
    });
  });

  describe("DatabaseConnectionError", () => {
    it("creates error with correct properties", () => {
      const error = new DatabaseConnectionError({
        message: "Connection timeout after 30s",
        cause: new Error("ECONNREFUSED"),
      });

      expect(error._tag).toBe("DatabaseConnectionError");
      expect(error.code).toBe("CONNECTION_ERROR");
      expect(error.message).toBe("Connection timeout after 30s");
    });
  });

  describe("DatabaseTransactionError", () => {
    it("creates error with correct properties", () => {
      const error = new DatabaseTransactionError({
        operation: "purchaseReward",
        message: "Transaction rolled back due to deadlock",
        cause: new Error("Deadlock detected"),
      });

      expect(error._tag).toBe("DatabaseTransactionError");
      expect(error.code).toBe("TRANSACTION_ERROR");
      expect(error.operation).toBe("purchaseReward");
    });
  });

  describe("ExternalAPIError", () => {
    it("creates error with correct properties", () => {
      const error = new ExternalAPIError({
        service: "SupabaseStorage",
        endpoint: "/upload",
        statusCode: 413,
        message: "File size exceeds limit",
      });

      expect(error._tag).toBe("ExternalAPIError");
      expect(error.code).toBe("API_ERROR");
      expect(error.service).toBe("SupabaseStorage");
      expect(error.endpoint).toBe("/upload");
      expect(error.statusCode).toBe(413);
      expect(error.message).toContain("File size exceeds limit");
    });

    it("creates error without status code", () => {
      const error = new ExternalAPIError({
        service: "PushAPI",
        endpoint: "/send",
        message: "Invalid payload",
      });

      expect(error.statusCode).toBeUndefined();
      expect(error.service).toBe("PushAPI");
    });
  });

  describe("ExternalAPITimeoutError", () => {
    it("creates error with correct properties", () => {
      const error = new ExternalAPITimeoutError({
        service: "PushNotificationAPI",
        endpoint: "/send",
        timeoutMs: 5000,
      });

      expect(error._tag).toBe("ExternalAPITimeoutError");
      expect(error.code).toBe("API_TIMEOUT");
      expect(error.service).toBe("PushNotificationAPI");
      expect(error.endpoint).toBe("/send");
      expect(error.timeoutMs).toBe(5000);
      expect(error.message).toContain("5000ms");
    });
  });

  describe("StorageError", () => {
    it("creates error with correct properties", () => {
      const error = new StorageError({
        operation: "uploadFile",
        path: "/avatars/user-123.jpg",
        message: "Insufficient permissions",
        cause: new Error("Access denied"),
      });

      expect(error._tag).toBe("StorageError");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.operation).toBe("uploadFile");
      expect(error.path).toBe("/avatars/user-123.jpg");
      expect(error.message).toContain("Insufficient permissions");
    });
  });

  describe("StorageFileNotFoundError", () => {
    it("creates error with correct properties", () => {
      const error = new StorageFileNotFoundError({
        path: "/documents/report-123.pdf",
      });

      expect(error._tag).toBe("StorageFileNotFoundError");
      expect(error.code).toBe("FILE_NOT_FOUND");
      expect(error.path).toBe("/documents/report-123.pdf");
      expect(error.message).toContain("not found");
    });
  });

  describe("MappingError", () => {
    it("creates error with field", () => {
      const error = new MappingError({
        source: "PrismaUser",
        target: "UserDomain",
        field: "email",
        message: "Invalid email format",
      });

      expect(error._tag).toBe("MappingError");
      expect(error.code).toBe("MAPPING_ERROR");
      expect(error.source).toBe("PrismaUser");
      expect(error.target).toBe("UserDomain");
      expect(error.field).toBe("email");
      expect(error.message).toContain("email");
    });

    it("creates error without field", () => {
      const error = new MappingError({
        source: "DrizzleRecord",
        target: "DomainEntity",
        message: "Record not found",
      });

      expect(error.field).toBeUndefined();
      expect(error.message).not.toContain("on field");
    });
  });

  describe("ConfigurationError", () => {
    it("creates error with correct properties", () => {
      const error = new ConfigurationError({
        key: "SUPABASE_URL",
        message: "Environment variable not set",
      });

      expect(error._tag).toBe("ConfigurationError");
      expect(error.code).toBe("CONFIG_ERROR");
      expect(error.key).toBe("SUPABASE_URL");
      expect(error.message).toBe("Environment variable not set");
    });
  });

  describe("isAdapterError", () => {
    it("returns true for ServiceError", () => {
      const error = new ServiceError({ operation: "test", message: "test" });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for DatabaseConnectionError", () => {
      const error = new DatabaseConnectionError({ message: "test" });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for ExternalAPIError", () => {
      const error = new ExternalAPIError({
        service: "test",
        endpoint: "/test",
        message: "test",
      });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for StorageError", () => {
      const error = new StorageError({
        operation: "test",
        path: "/test",
        message: "test",
      });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for MappingError", () => {
      const error = new MappingError({
        source: "test",
        target: "test",
        message: "test",
      });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for ConfigurationError", () => {
      const error = new ConfigurationError({ key: "test", message: "test" });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns true for DatabaseError from domain", () => {
      const error = new DatabaseError({ operation: "test", message: "test" });
      expect(isAdapterError(error)).toBe(true);
    });

    it("returns false for regular Error", () => {
      expect(isAdapterError(new Error("test"))).toBe(false);
    });

    it("returns false for null", () => {
      expect(isAdapterError(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isAdapterError(undefined)).toBe(false);
    });

    it("returns false for string", () => {
      expect(isAdapterError("error")).toBe(false);
    });
  });

  describe("getAdapterErrorMessage", () => {
    it("returns message from ServiceError", () => {
      const error = new ServiceError({
        operation: "test",
        message: "test message",
      });
      expect(getAdapterErrorMessage(error)).toBe("test message");
    });

    it("returns message from ExternalAPIError", () => {
      const error = new ExternalAPIError({
        service: "test",
        endpoint: "/test",
        message: "API failed",
      });
      expect(getAdapterErrorMessage(error)).toContain("API failed");
    });
  });

  describe("getAdapterErrorCode", () => {
    it("returns code from ServiceError", () => {
      const error = new ServiceError({ operation: "test", message: "test" });
      expect(getAdapterErrorCode(error)).toBe("SERVICE_ERROR");
    });

    it("returns code from ExternalAPIError", () => {
      const error = new ExternalAPIError({
        service: "test",
        endpoint: "/test",
        message: "test",
      });
      expect(getAdapterErrorCode(error)).toBe("API_ERROR");
    });

    it("returns code from DatabaseError", () => {
      const error = new DatabaseError({ operation: "test", message: "test" });
      // DatabaseError from domain doesn't have a code property
      // so getAdapterErrorCode returns undefined
      expect(getAdapterErrorCode(error)).toBeUndefined();
    });
  });
});
