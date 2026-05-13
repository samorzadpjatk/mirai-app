import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useMapSelectedUser } from "../../map/useMapSelectedUser";
import type { UserLocation } from "~/components/map/UserMap";

describe("useMapSelectedUser", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockUpdateSharing = jest.fn() as any;

  const mockUsers: UserLocation[] = [
    {
      id: "user-1",
      name: "John Doe",
      coordinate: [21.01, 52.23],
      email: "john@example.com",
      lastActiveAt: Date.now(),
    },
    {
      id: "user-2",
      name: "Jane Smith",
      coordinate: [21.02, 52.24],
      email: "jane@example.com",
      lastActiveAt: Date.now(),
    },
    {
      id: "user-3",
      name: "Bob Wilson",
      coordinate: [21.03, 52.25],
      email: "bob@example.com",
      lastActiveAt: Date.now(),
    },
  ];

  const defaultArgs = {
    session: { user: { id: "user-1" } },
    users: mockUsers,
    sharingUserIds: ["user-2", "user-3"],
    updateSharing: mockUpdateSharing,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with no selected user", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    expect(result.current.selectedUserId).toBeNull();
    expect(result.current.selectedUser).toBeNull();
  });

  it("should select a user", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.selectedUserId).toBe("user-2");
    expect(result.current.selectedUser).toEqual(mockUsers[1]);
  });

  it("should deselect a user", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.selectedUserId).toBe("user-2");

    act(() => {
      result.current.deselect();
    });

    expect(result.current.selectedUserId).toBeNull();
    expect(result.current.selectedUser).toBeNull();
  });

  it("should find selected user from users array", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[2]!);
    });

    expect(result.current.selectedUser?.id).toBe("user-3");
    expect(result.current.selectedUser?.name).toBe("Bob Wilson");
  });

  it("should return null selectedUser when user not found", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser({
        id: "non-existent",
        name: "Unknown",
        coordinate: [0, 0],
        lastActiveAt: Date.now(),
      });
    });

    expect(result.current.selectedUserId).toBe("non-existent");
    expect(result.current.selectedUser).toBeNull();
  });

  it("should determine canStopSharing for other shared users", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.canStopSharing).toBe(true);
  });

  it("should not allow stopping sharing for current user", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[0]!);
    });

    expect(result.current.canStopSharing).toBe(false);
  });

  it("should not allow stopping sharing for non-shared users", () => {
    const args = {
      ...defaultArgs,
      sharingUserIds: ["user-2"],
    };
    const { result } = renderHook(() => useMapSelectedUser(args));

    act(() => {
      result.current.selectUser(mockUsers[2]!);
    });

    expect(result.current.canStopSharing).toBe(false);
  });

  it("should not allow stopping sharing when no user selected", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    expect(result.current.canStopSharing).toBe(false);
  });

  it("should stop sharing and remove user from sharing list", async () => {
    mockUpdateSharing.mockResolvedValue(undefined);
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    await act(async () => {
      await result.current.stopSharing();
    });

    expect(mockUpdateSharing).toHaveBeenCalledWith(["user-3"]);
  });

  it("should not call updateSharing when no user selected", async () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    await act(async () => {
      await result.current.stopSharing();
    });

    expect(mockUpdateSharing).not.toHaveBeenCalled();
  });

  it("should handle stopSharing error gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());
    mockUpdateSharing.mockRejectedValue(new Error("Update failed"));
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    await act(async () => {
      await result.current.stopSharing();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to stop sharing:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("should handle mapUserPress and return the user", () => {
    const { result } = renderHook(() => useMapSelectedUser(defaultArgs));

    let returnedUser: UserLocation | null = null;
    act(() => {
      returnedUser = result.current.mapUserPress(mockUsers[1]!);
    });

    expect(result.current.selectedUserId).toBe("user-2");
    expect(returnedUser).toEqual(mockUsers[1]);
  });

  it("should update selectedUser when users array changes", () => {
    const { result, rerender } = renderHook(
      ({ users }: { users: UserLocation[] }) => useMapSelectedUser({ ...defaultArgs, users }),
      { initialProps: { users: mockUsers } },
    );

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.selectedUser?.name).toBe("Jane Smith");

    const updatedUsers = [...mockUsers];
    updatedUsers[1] = { ...mockUsers[1]!, name: "Jane Updated" };

    rerender({ users: updatedUsers });

    expect(result.current.selectedUser?.name).toBe("Jane Updated");
  });

  it("should handle session without user id", () => {
    const args = {
      ...defaultArgs,
      session: { user: {} },
    };
    const { result } = renderHook(() => useMapSelectedUser(args));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.canStopSharing).toBe(true);
  });

  it("should handle null session", () => {
    const args = {
      ...defaultArgs,
      session: null,
    };
    const { result } = renderHook(() => useMapSelectedUser(args));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.canStopSharing).toBe(true);
  });

  it("should handle empty sharingUserIds", () => {
    const args = {
      ...defaultArgs,
      sharingUserIds: [],
    };
    const { result } = renderHook(() => useMapSelectedUser(args));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    expect(result.current.canStopSharing).toBe(false);
  });

  it("should memoize selectedUser", () => {
    const { result, rerender } = renderHook(
      ({ users }: { users: UserLocation[] }) => useMapSelectedUser({ ...defaultArgs, users }),
      { initialProps: { users: mockUsers } },
    );

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    const firstSelectedUser: UserLocation | null = result.current.selectedUser;

    rerender({ users: mockUsers });

    expect(result.current.selectedUser).toBe(firstSelectedUser);
  });

  it("should remove all users from sharing when stopping sharing with last user", async () => {
    mockUpdateSharing.mockResolvedValue(undefined);
    const args = {
      ...defaultArgs,
      sharingUserIds: ["user-2"],
    };
    const { result } = renderHook(() => useMapSelectedUser(args));

    act(() => {
      result.current.selectUser(mockUsers[1]!);
    });

    await act(async () => {
      await result.current.stopSharing();
    });

    expect(mockUpdateSharing).toHaveBeenCalledWith([]);
  });
});
