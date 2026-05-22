import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useShareModal } from "../../ui/useShareModal";

describe("useShareModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with closed state", () => {
    const { result } = renderHook(() => useShareModal({}));

    expect(result.current.open).toBe(false);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.selectedUsers.size).toBe(0);
  });

  it("should initialize with open state when initialOpen is true", () => {
    const { result } = renderHook(() => useShareModal({ initialOpen: true }));

    expect(result.current.open).toBe(true);
  });

  it("should open modal when openModal is called", () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.openModal();
    });

    expect(result.current.open).toBe(true);
  });

  it("should close modal when closeModal is called", () => {
    const { result } = renderHook(() => useShareModal({ initialOpen: true }));

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.open).toBe(false);
  });

  it("should update search query", () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.setSearchQuery("john");
    });

    expect(result.current.searchQuery).toBe("john");
  });

  it("should add user to selected users", () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    expect(result.current.selectedUsers.has("user-1")).toBe(true);
  });

  it("should remove user from selected users when toggled again", () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    expect(result.current.selectedUsers.has("user-1")).toBe(true);

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    expect(result.current.selectedUsers.has("user-1")).toBe(false);
  });

  it("should add multiple users to selection", () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.toggleSelectedUser("user-1");
      result.current.toggleSelectedUser("user-2");
      result.current.toggleSelectedUser("user-3");
    });

    expect(result.current.selectedUsers.size).toBe(3);
    expect(result.current.selectedUsers.has("user-1")).toBe(true);
    expect(result.current.selectedUsers.has("user-2")).toBe(true);
    expect(result.current.selectedUsers.has("user-3")).toBe(true);
  });

  it("should reset state when reset is called", () => {
    const { result } = renderHook(() => useShareModal({ initialOpen: true }));

    act(() => {
      result.current.setSearchQuery("search");
      result.current.toggleSelectedUser("user-1");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.searchQuery).toBe("");
    expect(result.current.selectedUsers.size).toBe(0);
  });

  it("should call updateSharing and reset on confirm", async () => {
    const mockUpdateSharing = jest
      .fn<(userIds: string[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useShareModal({
        sharingUserIds: ["existing-user"],
        updateSharing: mockUpdateSharing,
      }),
    );

    act(() => {
      result.current.toggleSelectedUser("user-1");
      result.current.toggleSelectedUser("user-2");
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockUpdateSharing).toHaveBeenCalledWith(
      expect.arrayContaining(["existing-user", "user-1", "user-2"]),
    );
    expect(result.current.open).toBe(false);
    expect(result.current.selectedUsers.size).toBe(0);
  });

  it("should handle updateSharing error gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());
    const mockUpdateSharing = jest
      .fn<(userIds: string[]) => Promise<void>>()
      .mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() =>
      useShareModal({
        sharingUserIds: [],
        updateSharing: mockUpdateSharing,
      }),
    );

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    await act(async () => {
      await result.current.confirm();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should work without updateSharing callback", async () => {
    const { result } = renderHook(() => useShareModal({}));

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(result.current.open).toBe(false);
  });

  it("should deduplicate user IDs on confirm", async () => {
    const mockUpdateSharing = jest
      .fn<(userIds: string[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useShareModal({
        sharingUserIds: ["user-1", "user-2"],
        updateSharing: mockUpdateSharing,
      }),
    );

    act(() => {
      result.current.toggleSelectedUser("user-2");
      result.current.toggleSelectedUser("user-3");
    });

    await act(async () => {
      await result.current.confirm();
    });

    const calledWith = mockUpdateSharing.mock.calls[0]![0];
    expect(calledWith).toHaveLength(3);
    expect(calledWith).toContain("user-1");
    expect(calledWith).toContain("user-2");
    expect(calledWith).toContain("user-3");
  });

  it("should handle empty initial sharingUserIds", async () => {
    const mockUpdateSharing = jest
      .fn<(userIds: string[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useShareModal({
        sharingUserIds: [],
        updateSharing: mockUpdateSharing,
      }),
    );

    act(() => {
      result.current.toggleSelectedUser("user-1");
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockUpdateSharing).toHaveBeenCalledWith(["user-1"]);
  });
});
