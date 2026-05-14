import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useGroupDetails } from "../../groups/useGroupDetails";

const mockUseQuery = jest.fn();
const mockGetMyQueryOptions = jest.fn((options: { input: Record<string, never> }) => ({
  queryKey: ["user", "getMy"],
  ...options,
}));
const mockGetByIdQueryOptions = jest.fn((options: { input: { id: string }; enabled: boolean }) => ({
  queryKey: ["group", "getById", options.input.id],
  ...options,
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    user: {
      getMy: {
        queryOptions: (options: { input: Record<string, never> }) => mockGetMyQueryOptions(options),
      },
    },
    group: {
      getById: {
        queryOptions: (options: { input: { id: string }; enabled: boolean }) =>
          mockGetByIdQueryOptions(options),
      },
    },
  },
}));

describe("useGroupDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("query initialization", () => {
    it("should fetch current user data", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      renderHook(() => useGroupDetails("group-123"));

      expect(mockGetMyQueryOptions).toHaveBeenCalledWith({ input: {} });
    });

    it("should fetch group data when groupId is provided", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      renderHook(() => useGroupDetails("group-123"));

      expect(mockGetByIdQueryOptions).toHaveBeenCalledWith({
        input: { id: "group-123" },
        enabled: true,
      });
    });

    it("should disable group query when groupId is null", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      renderHook(() => useGroupDetails(null));

      expect(mockGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "" }, enabled: false });
    });

    it("should disable group query when groupId is undefined", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      renderHook(() => useGroupDetails(undefined));

      expect(mockGetByIdQueryOptions).toHaveBeenCalledWith({ input: { id: "" }, enabled: false });
    });
  });

  describe("current user data", () => {
    it("should return current user from query", () => {
      const mockUser = { id: "user-1", name: "John Doe", email: "john@example.com" };
      mockUseQuery
        .mockReturnValueOnce({ data: mockUser, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it("should return null when user data is not available", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.currentUser).toBeNull();
    });

    it("should return user loading state", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: true })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingUser).toBe(true);
    });

    it("should return false when user is not loading", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingUser).toBe(false);
    });
  });

  describe("group data", () => {
    it("should return group from query", () => {
      const mockGroup = {
        id: "group-123",
        name: "Test Group",
        code: "TG123",
        image: "group.jpg",
        participants: [{ id: "user-1", name: "John" }],
        trip: { id: "trip-1", name: "Summer Trip" },
      };
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: mockGroup, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.group).toEqual(mockGroup);
    });

    it("should return undefined when group data is not available", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: undefined, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.group).toBeUndefined();
    });

    it("should return group loading state", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: true });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingGroup).toBe(true);
    });

    it("should return false when group is not loading", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingGroup).toBe(false);
    });
  });

  describe("combined loading state", () => {
    it("should handle both queries loading", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: true })
        .mockReturnValueOnce({ data: null, isLoading: true });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingUser).toBe(true);
      expect(result.current.isLoadingGroup).toBe(true);
    });

    it("should handle only user loading", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: true })
        .mockReturnValueOnce({ data: null, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingUser).toBe(true);
      expect(result.current.isLoadingGroup).toBe(false);
    });

    it("should handle only group loading", () => {
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: null, isLoading: true });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.isLoadingUser).toBe(false);
      expect(result.current.isLoadingGroup).toBe(true);
    });

    it("should handle both queries complete", () => {
      const mockUser = { id: "user-1", name: "John" };
      const mockGroup = { id: "group-123", name: "Test Group" };
      mockUseQuery
        .mockReturnValueOnce({ data: mockUser, isLoading: false })
        .mockReturnValueOnce({ data: mockGroup, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.group).toEqual(mockGroup);
      expect(result.current.isLoadingUser).toBe(false);
      expect(result.current.isLoadingGroup).toBe(false);
    });
  });

  describe("complete group details", () => {
    it("should return full group details with participants", () => {
      const mockGroup = {
        id: "group-123",
        name: "Alpha Team",
        code: "AT001",
        image: "https://example.com/group.jpg",
        participants: [
          { id: "user-1", name: "Alice", avatar: "alice.jpg" },
          { id: "user-2", name: "Bob", avatar: "bob.jpg" },
        ],
        trip: {
          id: "trip-1",
          name: "Summer Adventure",
          startDate: "2024-06-01",
          endDate: "2024-06-07",
        },
      };
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: mockGroup, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.group).toEqual(mockGroup);
      expect(result.current.group?.participants).toHaveLength(2);
      expect(result.current.group?.trip).toBeDefined();
    });

    it("should handle group without image", () => {
      const mockGroup = {
        id: "group-123",
        name: "Beta Squad",
        code: "BS001",
        image: null,
        participants: [],
        trip: { id: "trip-1", name: "Winter Trip" },
      };
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: mockGroup, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.group?.image).toBeNull();
    });

    it("should handle group without participants", () => {
      const mockGroup = {
        id: "group-123",
        name: "Empty Group",
        code: "EG001",
        image: "group.jpg",
        participants: [],
        trip: { id: "trip-1", name: "Test Trip" },
      };
      mockUseQuery
        .mockReturnValueOnce({ data: null, isLoading: false })
        .mockReturnValueOnce({ data: mockGroup, isLoading: false });

      const { result } = renderHook(() => useGroupDetails("group-123"));

      expect(result.current.group?.participants).toEqual([]);
    });
  });
});
