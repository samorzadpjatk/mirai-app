import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLoginForm } from "../useLoginForm";
import { useAuth } from "../../authHooks";

vi.mock("../../authHooks", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

type AuthContextValue = ReturnType<typeof useAuth>;

describe("useLoginForm", () => {
  const mockSignInWithOtp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      signInWithOtp: mockSignInWithOtp,
    } as unknown as AuthContextValue);
  });

  it("should initialize with empty form state", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.formState).toEqual({
      email: "",
      isLoading: false,
      isSent: false,
      error: null,
    });
  });

  it("should update email field", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    expect(result.current.formState.email).toBe("test@example.com");
  });



  it("should show error when submitting without email", async () => {
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Please enter your email");
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });



  it("should successfully submit login form and mark as sent", async () => {
    mockSignInWithOtp.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      // onSuccess is not called here - login happens after the user completes the email link/OTP
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.formState.error).toBeNull();
      expect(result.current.formState.isLoading).toBe(false);
      expect(result.current.formState.isSent).toBe(true);
    });
  });

  it("should set loading state during submission", async () => {
    let resolveSignIn: () => void;
    const signInPromise = new Promise<void>((resolve) => {
      resolveSignIn = resolve;
    });
    mockSignInWithOtp.mockReturnValue(signInPromise);

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    // Verify initial state
    expect(result.current.formState.isLoading).toBe(false);

    // Start submission - don't await yet
    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit();
    });

    // Loading should be true immediately after calling handleSubmit
    await waitFor(() => {
      expect(result.current.formState.isLoading).toBe(true);
    });

    // Resolve the sign in
    resolveSignIn!();

    // Wait for submission to complete
    await act(async () => {
      await submitPromise!;
    });

    // Loading should be false after completion
    expect(result.current.formState.isLoading).toBe(false);
  });

  it("should handle submission error", async () => {
    const errorMessage = "Invalid credentials";
    mockSignInWithOtp.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.formState.error).toBe(errorMessage);
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should handle non-Error exceptions", async () => {
    mockSignInWithOtp.mockRejectedValue("String error");
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.formState.error).toBe("Failed to send login email");
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should clear error message", async () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.formState.error).toBeNull();
  });

  it("should not call onSuccess if submission fails", async () => {
    mockSignInWithOtp.mockRejectedValue(new Error("Network error"));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.formState.error).toBe("Network error");
    });
  });
});
