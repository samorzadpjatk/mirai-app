import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { TripListItem } from "~/components/trips/list/types";

const mockSecureGetItemAsync = jest.fn();
const mockSecureSetItemAsync = jest.fn();
const mockSecureDeleteItemAsync = jest.fn();

const mockAsyncGetItem = jest.fn();
const mockAsyncSetItem = jest.fn();
const mockAsyncRemoveItem = jest.fn();

jest.mock("expo-secure-store", () => ({
  getItemAsync: (...args: unknown[]) => mockSecureGetItemAsync(...args),
  setItemAsync: (...args: unknown[]) => mockSecureSetItemAsync(...args),
  deleteItemAsync: (...args: unknown[]) => mockSecureDeleteItemAsync(...args),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args: unknown[]) => mockAsyncGetItem(...args),
  setItem: (...args: unknown[]) => mockAsyncSetItem(...args),
  removeItem: (...args: unknown[]) => mockAsyncRemoveItem(...args),
}));

import {
  getSelectedTripIdFromStorage,
  setSelectedTripIdInStorage,
  clearSelectedTripIdInStorage,
  getCachedTrips,
  setCachedTrips,
  upsertCachedTripListItem,
  getCachedTripById,
  setCachedTripById,
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

      expect(mockSecureSetItemAsync).toHaveBeenCalledWith(
        "selected_trip_id",
        "trip-123"
      );
    });
  });

  describe("clearSelectedTripIdInStorage", () => {
    it("should remove trip id from secure storage", async () => {
      await clearSelectedTripIdInStorage();

      expect(mockSecureDeleteItemAsync).toHaveBeenCalledWith("selected_trip_id");
    });
  });

  describe("getCachedTrips", () => {
    it("should return empty array when no trips cached", async () => {
      mockAsyncGetItem.mockResolvedValue(null);

      const result = await getCachedTrips();

      expect(result).toEqual([]);
    });

    it("should return cached trips", async () => {
      const trips = [
        createMockTrip("trip-1", "Trip 1"),
        createMockTrip("trip-2", "Trip 2"),
      ];
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(trips));

      const result = await getCachedTrips();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("trip-1");
      expect(result[1].id).toBe("trip-2");
    });

    it("should filter out invalid trip items", async () => {
      const trips = [
        createMockTrip("trip-1", "Trip 1"),
        { id: "trip-2" },
        { name: "Trip 3" },
        "invalid",
        null,
      ];
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(trips));

      const result = await getCachedTrips();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("trip-1");
    });

    it("should return empty array when cache is not an array", async () => {
      mockAsyncGetItem.mockResolvedValue(JSON.stringify({ not: "an array" }));

      const result = await getCachedTrips();

      expect(result).toEqual([]);
    });

    it("should handle parse errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockAsyncGetItem.mockResolvedValue("invalid-json");

      const result = await getCachedTrips();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to read cache key "trips.cache.v1":',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should handle JSON.parse returning null", async () => {
      mockAsyncGetItem.mockResolvedValue("null");

      const result = await getCachedTrips();

      expect(result).toEqual([]);
    });

    it("should handle JSON.parse returning null for details cache", async () => {
      mockAsyncGetItem.mockImplementation((key: string) => {
        if (key === "trip.details.cache.v1") return Promise.resolve("null");
        return Promise.resolve(null);
      });

      const result = await getCachedTripById("trip-1");

      expect(result).toBeNull();
    });
  });

  describe("setCachedTrips", () => {
    it("should store trips in cache", async () => {
      const trips = [createMockTrip("trip-1", "Trip 1")];

      await setCachedTrips(trips);

      expect(mockAsyncSetItem).toHaveBeenCalledWith(
        "trips.cache.v1",
        JSON.stringify(trips)
      );
    });

    it("should handle storage errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockAsyncSetItem.mockRejectedValue(new Error("Storage error"));

      await setCachedTrips([createMockTrip("trip-1", "Trip 1")]);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write cache key "trips.cache.v1":',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("upsertCachedTripListItem", () => {
    it("should add new trip to empty cache", async () => {
      mockAsyncGetItem.mockResolvedValue(null);

      const newTrip = createMockTrip("trip-1", "Trip 1");
      await upsertCachedTripListItem(newTrip);

      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripListItem[];
      expect(storedData).toHaveLength(1);
      expect(storedData[0]?.id).toBe("trip-1");
    });

    it("should add new trip to existing cache", async () => {
      const existingTrips = [createMockTrip("trip-1", "Trip 1")];
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(existingTrips));

      const newTrip = createMockTrip("trip-2", "Trip 2");
      await upsertCachedTripListItem(newTrip);

      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripListItem[];
      expect(storedData).toHaveLength(2);
    });

    it("should update existing trip by id", async () => {
      const existingTrips = [
        createMockTrip("trip-1", "Old Name"),
        createMockTrip("trip-2", "Trip 2"),
      ];
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(existingTrips));

      const updatedTrip = createMockTrip("trip-1", "New Name");
      await upsertCachedTripListItem(updatedTrip);

      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripListItem[];
      expect(storedData).toHaveLength(2);
      const trip1 = storedData.find((t: TripListItem) => t.id === "trip-1");
      expect(trip1?.name).toBe("New Name");
    });

    it("should merge trip properties on update", async () => {
      const existingTrips = [
        {
          id: "trip-1",
          name: "Old Name",
          description: "Old Description",
          startDate: "2024-01-01",
          endDate: "2024-01-10",
        },
      ];
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(existingTrips));

      const updatedTrip = {
        id: "trip-1",
        name: "New Name",
      };
      await upsertCachedTripListItem(updatedTrip as TripListItem);

      type TripWithDescription = TripListItem & { description?: string };
      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripWithDescription[];
      const trip1 = storedData[0];
      expect(trip1?.name).toBe("New Name");
      expect(trip1?.description).toBe("Old Description");
    });
  });

  describe("getCachedTripById", () => {
    it("should return trip from details cache", async () => {
      const detailsMap = {
        "trip-1": { id: "trip-1", name: "Trip 1", extra: "data" },
      };
      mockAsyncGetItem.mockImplementation((key: string) => {
        if (key === "trip.details.cache.v1") {
          return Promise.resolve(JSON.stringify(detailsMap));
        }
        return Promise.resolve(null);
      });

      const result = await getCachedTripById("trip-1");

      expect(result).toEqual(detailsMap["trip-1"]);
    });

    it("should return trip from trips list cache as fallback", async () => {
      const trips = [createMockTrip("trip-1", "Trip 1")];
      mockAsyncGetItem.mockImplementation((key: string) => {
        if (key === "trip.details.cache.v1") return Promise.resolve("{}");
        if (key === "trips.cache.v1") return Promise.resolve(JSON.stringify(trips));
        return Promise.resolve(null);
      });

      const result = await getCachedTripById("trip-1");

      expect(result).toBeTruthy();
      expect((result as TripListItem).id).toBe("trip-1");
    });

    it("should return null when trip not found", async () => {
      mockAsyncGetItem.mockResolvedValue(null);

      const result = await getCachedTripById("non-existent");

      expect(result).toBeNull();
    });

    it("should handle parse errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockAsyncGetItem.mockResolvedValue("invalid-json");

      const result = await getCachedTripById("trip-1");

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe("setCachedTripById", () => {
    it("should store trip in details cache", async () => {
      mockAsyncGetItem.mockResolvedValue("{}");

      const trip = { id: "trip-1", name: "Trip 1", extra: "data" };
      await setCachedTripById("trip-1", trip);

      type TripDetailsMap = Record<string, Record<string, string>>;
      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripDetailsMap;
      expect(storedData["trip-1"]).toEqual(trip);
    });

    it("should add to existing details cache", async () => {
      const existingMap = {
        "trip-1": { id: "trip-1", name: "Trip 1" },
      };
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(existingMap));

      const newTrip = { id: "trip-2", name: "Trip 2" };
      await setCachedTripById("trip-2", newTrip);

      type TripDetailsMap = Record<string, { id: string; name: string }>;
      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripDetailsMap;
      expect(storedData["trip-1"]).toBeDefined();
      expect(storedData["trip-2"]).toBeDefined();
    });

    it("should update existing trip in cache", async () => {
      const existingMap = {
        "trip-1": { id: "trip-1", name: "Old Name" },
      };
      mockAsyncGetItem.mockResolvedValue(JSON.stringify(existingMap));

      const updatedTrip = { id: "trip-1", name: "New Name" };
      await setCachedTripById("trip-1", updatedTrip);

      type TripDetailsMap = Record<string, { id: string; name: string }>;
      const storedData = JSON.parse(mockAsyncSetItem.mock.calls[0][1]) as TripDetailsMap;
      expect(storedData["trip-1"]?.name).toBe("New Name");
    });

    it("should handle storage errors gracefully", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      mockAsyncGetItem.mockResolvedValue("{}");
      mockAsyncSetItem.mockRejectedValue(new Error("Storage error"));

      await setCachedTripById("trip-1", { id: "trip-1", name: "Trip 1" });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to write cache key "trip.details.cache.v1":',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

function createMockTrip(id: string, name: string): TripListItem {
  return {
    id,
    name,
    startDate: "2024-01-01",
    endDate: "2024-01-10",
  };
}
