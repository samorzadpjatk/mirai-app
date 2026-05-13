import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useMyGroup } from "../../groups/useMyGroup";

const mockUseQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const mockGroupGetMyQueryOptions = jest.fn(
  (params: { input: { tripId: string }; enabled?: boolean }) => ({
    queryKey: ["group", "getMy", params.input.tripId],
    enabled: params.enabled,
  }),
);

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    group: {
      getMy: {
        queryOptions: (params: { input: { tripId: string }; enabled?: boolean }) =>
          mockGroupGetMyQueryOptions(params),
      },
    },
  },
}));

describe("useMyGroup", () => {
  describe("query initialization", () => {
    it("should fetch my group when tripId is provided", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyGroup("trip-123"));

      expect(mockGroupGetMyQueryOptions).toHaveBeenCalledWith({
        input: { tripId: "trip-123" },
        enabled: true,
      });
    });

    it("should disable query when tripId is null", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyGroup(null));

      expect(mockGroupGetMyQueryOptions).toHaveBeenCalledWith({
        input: { tripId: "" },
        enabled: false,
      });
    });

    it("should disable query when tripId is undefined", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderHook(() => useMyGroup(undefined));

      expect(mockGroupGetMyQueryOptions).toHaveBeenCalledWith({
        input: { tripId: "" },
        enabled: false,
      });
    });
  });

  describe("group data", () => {
    it("should return group data when available", () => {
      const mockGroup = {
        id: "group-123",
        name: "My Awesome Group",
        code: "MAG001",
        image: "https://example.com/group.jpg",
        participants: [
          { id: "user-1", name: "Alice" },
          { id: "user-2", name: "Bob" },
        ],
        trip: { id: "trip-123", name: "Summer Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toEqual(mockGroup);
    });

    it("should return null when user has no group", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toBeNull();
    });

    it("should return null when data is undefined", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toBeNull();
    });
  });

  describe("loading states", () => {
    it("should return isLoading true when query is loading", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.isLoading).toBe(true);
    });

    it("should return isLoading false when query is complete", () => {
      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test Group" },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.isLoading).toBe(false);
    });

    it("should return isLoading false when query has error", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error states", () => {
    it("should return error when query fails", () => {
      const mockError = new Error("Network error");
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.error).toEqual(mockError);
    });

    it("should return null error when query succeeds", () => {
      mockUseQuery.mockReturnValue({
        data: { id: "group-123", name: "Test Group" },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.error).toBeNull();
    });

    it("should handle query error with error message", () => {
      const mockError = new Error("User not in any group");
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.error?.message).toBe("User not in any group");
      expect(result.current.group).toBeNull();
    });
  });

  describe("complete state scenarios", () => {
    it("should handle loading state correctly", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("should handle success state correctly", () => {
      const mockGroup = {
        id: "group-456",
        name: "Winners",
        code: "WIN001",
        image: "winners.jpg",
        participants: [{ id: "user-1", name: "John" }],
        trip: { id: "trip-123", name: "Championship" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toEqual(mockGroup);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should handle error state correctly", () => {
      const mockError = new Error("Trip not found");

      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useMyGroup("invalid-trip"));

      expect(result.current.group).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toEqual(mockError);
    });

    it("should handle user without group (null data, no error)", () => {
      mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("group structure", () => {
    it("should return group with all properties", () => {
      const mockGroup = {
        id: "group-789",
        name: "Test Group",
        code: "TG789",
        image: "https://example.com/image.jpg",
        participants: [
          { id: "user-1", name: "User One", avatar: "avatar1.jpg" },
          { id: "user-2", name: "User Two", avatar: "avatar2.jpg" },
        ],
        trip: {
          id: "trip-123",
          name: "Test Trip",
          startDate: "2024-01-01",
          endDate: "2024-01-07",
        },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group).toHaveProperty("id");
      expect(result.current.group).toHaveProperty("name");
      expect(result.current.group).toHaveProperty("code");
      expect(result.current.group).toHaveProperty("image");
      expect(result.current.group).toHaveProperty("participants");
      expect(result.current.group).toHaveProperty("trip");
      expect(result.current.group?.participants).toHaveLength(2);
    });

    it("should handle group with no image", () => {
      const mockGroup = {
        id: "group-123",
        name: "No Image Group",
        code: "NIG001",
        image: null,
        participants: [],
        trip: { id: "trip-123", name: "Test Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group?.image).toBeNull();
    });

    it("should handle group with no participants", () => {
      const mockGroup = {
        id: "group-123",
        name: "Empty Group",
        code: "EG001",
        image: "group.jpg",
        participants: [],
        trip: { id: "trip-123", name: "Test Trip" },
      };

      mockUseQuery.mockReturnValue({
        data: mockGroup,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useMyGroup("trip-123"));

      expect(result.current.group?.participants).toEqual([]);
    });
  });
});
