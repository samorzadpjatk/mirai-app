import { describe, expect, it } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import { useGroupDetails } from "../../groups/useGroupDetails";

describe("useGroupDetails (MSW)", () => {
  it("should return group and current user data when API returns data", async () => {
    const mockUser = { id: "user-1", name: "John Doe", email: "john@example.com" };
    const mockGroup = {
      id: "group-123",
      name: "Test Group",
      code: "TG123",
      image: "group.jpg",
      participants: [{ id: "user-1", name: "John" }],
      trip: { id: "trip-1", name: "Summer Trip" },
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.tripId).toBe("trip-1");
  });

  it("should return undefined group when groupId is null", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(null));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.tripId).toBe("");
  });

  it("should return undefined group when groupId is undefined", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(undefined));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
    expect(result.current.tripId).toBe("");
  });

  it("should return undefined group when groupId is empty string", async () => {
    const mockUser = { id: "user-1", name: "John" };

    server.use(createORPCHandler(["user", "getMy"], () => mockUser));

    const { result } = renderHookWithMSW(() => useGroupDetails(""));

    await waitFor(() => {
      expect(result.current.isLoadingUser).toBe(false);
    });

    expect(result.current.group).toBeUndefined();
    expect(result.current.isLoadingGroup).toBe(false);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.tripId).toBe("");
  });

  it("should handle loading states while fetching", async () => {
    const mockUser = { id: "user-1", name: "John" };
    const mockGroup = {
      id: "group-123",
      name: "Test Group",
      code: "TG123",
      image: "group.jpg",
      participants: [],
      trip: { id: "trip-1", name: "Summer Trip" },
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    expect(result.current.isLoadingUser).toBe(true);
    expect(result.current.isLoadingGroup).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.tripId).toBe("trip-1");
  });

  it("should handle group with minimal data", async () => {
    const mockUser = { id: "user-1", name: "John" };
    const mockGroup = {
      id: "group-min",
      name: "Minimal Group",
      code: "MIN01",
      image: null,
      participants: [],
      trip: null,
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-min"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.group!.participants).toEqual([]);
    expect(result.current.group!.trip).toBeNull();
    expect(result.current.tripId).toBe("");
  });

  it("should handle group with multiple participants", async () => {
    const mockUser = { id: "user-1", name: "Alice" };
    const mockGroup = {
      id: "group-multi",
      name: "Big Group",
      code: "BG001",
      image: "big.jpg",
      participants: [
        { id: "user-1", name: "Alice" },
        { id: "user-2", name: "Bob" },
        { id: "user-3", name: "Charlie" },
      ],
      trip: { id: "trip-1", name: "Winter Trip" },
    };

    server.use(
      createORPCHandler(["user", "getMy"], () => mockUser),
      createORPCHandler(["group", "getById"], () => mockGroup),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-multi"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toEqual(mockGroup);
    expect(result.current.group!.participants).toHaveLength(3);
    expect(result.current.tripId).toBe("trip-1");
  });

  it("should handle both APIs returning null", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => null),
      createORPCHandler(["group", "getById"], () => null),
    );

    const { result } = renderHookWithMSW(() => useGroupDetails("group-123"));

    await waitFor(() => {
      expect(result.current.isLoadingGroup).toBe(false);
    });

    expect(result.current.group).toBeNull();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isLoadingUser).toBe(false);
    expect(result.current.tripId).toBe("");
  });
});
