import { describe, it, expect } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { useMyGroup } from "../../groups/useMyGroup";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";

describe("useMyGroup (MSW)", () => {
  it("should return group data when API returns data", async () => {
    const mockGroup = {
      id: "group-123",
      name: "My Awesome Group",
      code: "MAG001",
      image: "https://example.com/group.jpg",
      participants: [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
      ],
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.error).toBeNull();
  });

  it("should return null when user has no group", async () => {
    server.use(createORPCHandler(["group", "getMy"], () => null));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is null", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(null));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is undefined", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(undefined));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should not fetch when tripId is empty string", async () => {
    const { result } = renderHookWithMSW(() => useMyGroup(""));

    expect(result.current.group).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should show loading state while fetching", async () => {
    const mockGroup = {
      id: "group-123",
      name: "My Group",
      code: "MG001",
      image: "group.jpg",
      participants: [],
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.group).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
  });

  it("should pass correct tripId to API", async () => {
    server.use(
      createORPCHandler(["group", "getMy"], (input) => {
        const typedInput = input as { tripId: string };
        return {
          id: "group-789",
          name: "Trip-Specific Group",
          code: "TSG001",
          image: "trip.jpg",
          participants: [],
        };
      }),
    );

    const { result } = renderHookWithMSW(() => useMyGroup("trip-456"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toBeDefined();
    expect(result.current.group!.id).toBe("group-789");
  });

  it("should handle group with minimal data", async () => {
    const mockGroup = {
      id: "group-min",
      name: "Minimal Group",
      code: "MIN01",
      image: null,
      participants: [],
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.group!.image).toBeNull();
    expect(result.current.group!.participants).toEqual([]);
  });

  it("should handle group with many participants", async () => {
    const mockGroup = {
      id: "group-big",
      name: "Big Group",
      code: "BG001",
      image: "big.jpg",
      participants: [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
        { id: "user-3", name: "Charlie" },
        { id: "user-4", name: "Diana" },
        { id: "user-5", name: "Eve" },
      ],
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.group!.participants).toHaveLength(5);
  });

  it("should handle group without trip", async () => {
    const mockGroup = {
      id: "group-456",
      name: "Standalone Group",
      code: "SG001",
      image: "standalone.jpg",
      participants: [{ id: "user-1", name: "Alice" }],
    };

    server.use(createORPCHandler(["group", "getMy"], () => mockGroup));

    const { result } = renderHookWithMSW(() => useMyGroup("trip-123"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
  });
});
