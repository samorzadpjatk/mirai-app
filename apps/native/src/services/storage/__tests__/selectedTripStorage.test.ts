import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockSecureGetItemAsync = jest.fn<(key: string) => Promise<string | null>>();
const mockSecureSetItemAsync = jest.fn<(key: string, value: string) => Promise<void>>();
const mockSecureDeleteItemAsync = jest.fn<(key: string) => Promise<void>>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: (...args: [string]) => mockSecureGetItemAsync(...args),
  setItemAsync: (...args: [string, string]) => mockSecureSetItemAsync(...args),
  deleteItemAsync: (...args: [string]) => mockSecureDeleteItemAsync(...args),
}));

import {
  clearSelectedTripIdInStorage,
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
} from "~/services/storage/selectedTripStorage";

describe("Selected Trip Storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSelectedTripIdFromStorage", () => {
    it("should return trip id from secure storage", async () => {
      mockSecureGetItemAsync.mockResolvedValue("trip-123");

      const result = await getSelectedTripIdFromStorage();

      expect(result).toBe("trip-123");
      expect(mockSecureGetItemAsync).toHaveBeenCalledWith("selected_trip_id");
    });

    it("should return null when no trip selected", async () => {
      mockSecureGetItemAsync.mockResolvedValue(null);

      const result = await getSelectedTripIdFromStorage();

      expect(result).toBeNull();
    });
  });

  describe("setSelectedTripIdInStorage", () => {
    it("should store trip id in secure storage", async () => {
      await setSelectedTripIdInStorage("trip-123");

      expect(mockSecureSetItemAsync).toHaveBeenCalledWith("selected_trip_id", "trip-123");
    });
  });

  describe("clearSelectedTripIdInStorage", () => {
    it("should remove trip id from secure storage", async () => {
      await clearSelectedTripIdInStorage();

      expect(mockSecureDeleteItemAsync).toHaveBeenCalledWith("selected_trip_id");
    });
  });
});
