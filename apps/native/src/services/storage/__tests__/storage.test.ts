import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockGetItemAsync = jest.fn<(key: string) => Promise<string | null>>();
const mockSetItemAsync = jest.fn<(key: string, value: string) => Promise<void>>();
const mockDeleteItemAsync = jest.fn<(key: string) => Promise<void>>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: (...args: [string]) => mockGetItemAsync(...args),
  setItemAsync: (...args: [string, string]) => mockSetItemAsync(...args),
  deleteItemAsync: (...args: [string]) => mockDeleteItemAsync(...args),
}));

import { authStorage } from "~/services/storage/storage";

describe("Auth Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItem", () => {
    it("should retrieve item from secure storage", async () => {
      mockGetItemAsync.mockResolvedValue("stored-value");

      const result = await authStorage.getItem("test-key");

      expect(result).toBe("stored-value");
      expect(mockGetItemAsync).toHaveBeenCalledWith("test-key");
    });

    it("should return null when item does not exist", async () => {
      mockGetItemAsync.mockResolvedValue(null);

      const result = await authStorage.getItem("non-existent-key");

      expect(result).toBeNull();
    });

    it("should propagate errors from secure store", async () => {
      const error = new Error("Secure store error");
      mockGetItemAsync.mockRejectedValue(error);

      await expect(authStorage.getItem("test-key")).rejects.toThrow(error);
    });
  });

  describe("setItem", () => {
    it("should store item in secure storage", async () => {
      await authStorage.setItem("test-key", "test-value");

      expect(mockSetItemAsync).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("should handle empty string values", async () => {
      await authStorage.setItem("test-key", "");

      expect(mockSetItemAsync).toHaveBeenCalledWith("test-key", "");
    });

    it("should propagate errors from secure store", async () => {
      const error = new Error("Secure store error");
      mockSetItemAsync.mockRejectedValue(error);

      await expect(authStorage.setItem("test-key", "value")).rejects.toThrow(error);
    });
  });

  describe("removeItem", () => {
    it("should delete item from secure storage", async () => {
      await authStorage.removeItem("test-key");

      expect(mockDeleteItemAsync).toHaveBeenCalledWith("test-key");
    });

    it("should not throw when deleting non-existent key", async () => {
      mockDeleteItemAsync.mockResolvedValue(undefined);

      await expect(authStorage.removeItem("non-existent")).resolves.not.toThrow();
    });

    it("should propagate errors from secure store", async () => {
      const error = new Error("Secure store error");
      mockDeleteItemAsync.mockRejectedValue(error);

      await expect(authStorage.removeItem("test-key")).rejects.toThrow(error);
    });
  });
});
