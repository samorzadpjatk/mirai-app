import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useMapSharing } from "../../map/useMapSharing";

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockUseMemo = jest.fn((fn) => fn());

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useMemo: (fn: () => unknown) => fn(),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    location: {
      getMySharingSettings: {
        queryOptions: jest.fn(() => ({ queryKey: ["sharing-settings"] })),
      },
      getAllUsersForSharing: {
        queryOptions: jest.fn((options: unknown) => options),
      },
      updateSharingSettings: {
        mutationOptions: jest.fn((options: unknown) => options),
      },
      removeUserFromSharing: {
        mutationOptions: jest.fn((options: unknown) => options),
      },
    },
  },
}));

jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe("useMapSharing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return sharing settings", () => {
    const mockSettings = {
      isSharingLocation: true,
      usersToShareWith: [{ id: "user-1", firstName: "John", lastName: "Doe" }],
    };

    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("sharing-settings")) {
        return { data: mockSettings, refetch: jest.fn() };
      }
      return { data: [], enabled: false };
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useMapSharing(true, "trip-123"));

    expect(result.current.sharingSettings).toEqual(mockSettings);
    expect(result.current.sharingUserIds).toEqual(["user-1"]);
  });

  it("should return empty sharing user ids when no settings", () => {
    mockUseQuery.mockImplementation((options: { queryKey?: string[] }) => {
      if (options?.queryKey?.includes("sharing-settings")) {
        return { data: null, refetch: jest.fn() };
      }
      return { data: [], enabled: false };
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() => useMapSharing(false, null));

    expect(result.current.sharingUserIds).toEqual([]);
    expect(result.current.allAvailableUsers).toEqual([]);
  });

  it("should expose mutation pending states", () => {
    mockUseQuery.mockReturnValue({ data: null, refetch: jest.fn() });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    const { result } = renderHook(() => useMapSharing(true, "trip-123"));

    expect(result.current.isUpdatingSharing).toBe(true);
    expect(result.current.isRemovingUser).toBe(true);
  });
});

import { extractSharingUserIds } from "../../map/useMapSharing";

describe("extractSharingUserIds", () => {
  it("should extract user ids from sharing settings", () => {
    const settings = {
      usersToShareWith: [{ id: "u1" }, { id: "u2" }, { id: "u3" }],
    };
    expect(extractSharingUserIds(settings)).toEqual(["u1", "u2", "u3"]);
  });

  it("should return empty array when settings is null", () => {
    expect(extractSharingUserIds(null)).toEqual([]);
  });

  it("should return empty array when settings is undefined", () => {
    expect(extractSharingUserIds(undefined)).toEqual([]);
  });

  it("should return empty array when usersToShareWith is empty", () => {
    expect(extractSharingUserIds({ usersToShareWith: [] })).toEqual([]);
  });
});
