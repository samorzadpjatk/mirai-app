import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useMyHouseMates } from "../../trips/useMyHouseMates";

describe("useMyHouseMates (MSW)", () => {
  it("should return house mates data when API returns data", async () => {
    const mockHouseMates = {
      houseNumber: "12",
      mates: [
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
        {
          id: "user-2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          role: "USER" as const,
          wristNumber: "456",
          houseNumber: "12",
          tripId: "trip-123",
          group: null,
        },
      ],
    };

    server.use(createORPCHandler(["user", "getMyHouseMates"], () => mockHouseMates));

    const { result } = renderHookWithMSW(() => useMyHouseMates("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.houseMates).toEqual(mockHouseMates);
    expect(result.current.error).toBeNull();
  });

  it("should return null when user has no house", async () => {
    server.use(createORPCHandler(["user", "getMyHouseMates"], () => null));

    const { result } = renderHookWithMSW(() => useMyHouseMates("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houseMates).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useMyHouseMates(null));

    expect(result.current.houseMates).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is undefined", async () => {
    const { result } = renderHookWithMSW(() => useMyHouseMates(undefined));

    expect(result.current.houseMates).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is empty string", async () => {
    const { result } = renderHookWithMSW(() => useMyHouseMates(""));

    expect(result.current.houseMates).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockHouseMates = {
      houseNumber: "12",
      mates: [
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
    };

    server.use(createORPCHandler(["user", "getMyHouseMates"], () => mockHouseMates));

    const { result } = renderHookWithMSW(() => useMyHouseMates("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.houseMates).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houseMates).toEqual(mockHouseMates);
  });

  it("should handle house with many mates", async () => {
    const mockHouseMates = {
      houseNumber: "12",
      mates: Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        firstName: `User ${i}`,
        lastName: "Test",
        email: `user${i}@example.com`,
        role: "USER" as const,
        wristNumber: String(i + 100),
        houseNumber: "12",
        tripId: "trip-123",
        group: null,
      })),
    };

    server.use(createORPCHandler(["user", "getMyHouseMates"], () => mockHouseMates));

    const { result } = renderHookWithMSW(() => useMyHouseMates("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.houseMates).toEqual(mockHouseMates);
    expect(result.current.houseMates!.mates).toHaveLength(10);
  });

  it("should pass correct tripId to API", async () => {
    let receivedTripId = "";

    server.use(
      createORPCHandler(["user", "getMyHouseMates"], (input) => {
        const typedInput = input as { tripId: string };
        receivedTripId = typedInput.tripId;
        return {
          houseNumber: "12",
          mates: [],
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useMyHouseMates("trip-456"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(receivedTripId).toBe("trip-456");
  });
});
