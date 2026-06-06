import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useTripHouses } from "../../trips/useTripHouses";

describe("useTripHouses (MSW)", () => {
  it("should return houses data when API returns data", async () => {
    const mockHouses = {
      houses: [
        {
          houseNumber: "12",
          occupants: [
            {
              id: "user-1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              role: "USER" as const,
              wristNumber: "123",
              houseNumber: "12",
              tripId: "trip-123",
              group: null,
            },
          ],
        },
        {
          houseNumber: "14",
          occupants: [
            {
              id: "user-2",
              firstName: "Jane",
              lastName: "Smith",
              email: "jane@example.com",
              role: "USER" as const,
              wristNumber: "456",
              houseNumber: "14",
              tripId: "trip-123",
              group: null,
            },
          ],
        },
      ],
      unassigned: [
        {
          id: "user-3",
          firstName: "Bob",
          lastName: "Wilson",
          email: "bob@example.com",
          role: "USER" as const,
          wristNumber: null,
          houseNumber: null,
          tripId: "trip-123",
          group: null,
        },
      ],
    };

    server.use(createORPCHandler(["user", "getTripHouses"], () => mockHouses));

    const { result } = renderHookWithMSW(() => useTripHouses("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.houses).toEqual(mockHouses.houses);
    expect(result.current.unassigned).toEqual(mockHouses.unassigned);
    expect(result.current.error).toBeNull();
  });

  it("should return empty arrays when no data", async () => {
    server.use(
      createORPCHandler(["user", "getTripHouses"], () => ({
        houses: [],
        unassigned: [],
      })),
    );

    const { result } = renderHookWithMSW(() => useTripHouses("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houses).toEqual([]);
    expect(result.current.unassigned).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useTripHouses(null));

    expect(result.current.houses).toEqual([]);
    expect(result.current.unassigned).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is undefined", async () => {
    const { result } = renderHookWithMSW(() => useTripHouses(undefined));

    expect(result.current.houses).toEqual([]);
    expect(result.current.unassigned).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is empty string", async () => {
    const { result } = renderHookWithMSW(() => useTripHouses(""));

    expect(result.current.houses).toEqual([]);
    expect(result.current.unassigned).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockHouses = {
      houses: [
        {
          houseNumber: "12",
          occupants: [],
        },
      ],
      unassigned: [],
    };

    server.use(createORPCHandler(["user", "getTripHouses"], () => mockHouses));

    const { result } = renderHookWithMSW(() => useTripHouses("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.houses).toEqual([]);
    expect(result.current.unassigned).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houses).toEqual(mockHouses.houses);
  });

  it("should handle many houses", async () => {
    const mockHouses = {
      houses: Array.from({ length: 20 }, (_, i) => ({
        houseNumber: String(i + 1),
        occupants: [
          {
            id: `user-${i}`,
            firstName: `User ${i}`,
            lastName: "Test",
            email: `user${i}@example.com`,
            role: "USER" as const,
            wristNumber: String(i + 100),
            houseNumber: String(i + 1),
            tripId: "trip-123",
            group: null,
          },
        ],
      })),
      unassigned: [],
    };

    server.use(createORPCHandler(["user", "getTripHouses"], () => mockHouses));

    const { result } = renderHookWithMSW(() => useTripHouses("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houses).toHaveLength(20);
  });

  it("should pass correct tripId to API", async () => {
    let receivedTripId = "";

    server.use(
      createORPCHandler(["user", "getTripHouses"], (input) => {
        const typedInput = input as { tripId: string };
        receivedTripId = typedInput.tripId;
        return {
          houses: [],
          unassigned: [],
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useTripHouses("trip-456"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(receivedTripId).toBe("trip-456");
  });

  it("should handle many unassigned users", async () => {
    const mockHouses = {
      houses: [],
      unassigned: Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        firstName: `User ${i}`,
        lastName: "Test",
        email: `user${i}@example.com`,
        role: "USER" as const,
        wristNumber: null,
        houseNumber: null,
        tripId: "trip-123",
        group: null,
      })),
    };

    server.use(createORPCHandler(["user", "getTripHouses"], () => mockHouses));

    const { result } = renderHookWithMSW(() => useTripHouses("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.unassigned).toHaveLength(10);
  });
});
