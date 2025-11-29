import { renderHook, act, waitFor } from "@testing-library/react";
import { useLoginForm } from "../useLoginForm";
import { useAuth } from "../../authHooks";

jest.mock("../../authHooks");

describe("useLoginForm", () => {
  const mockSignInWithEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signInWithEmail: mockSignInWithEmail,
    });
  });

  it("should initialize with empty form state", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.formState).toEqual({
      email: "",
      password: "",
      isLoading: false,
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

  it("should update password field", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setPassword("password123");
    });

    expect(result.current.formState.password).toBe("password123");
  });

  it("should show error when submitting without email", async () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe(
      "Please enter email and password",
    );
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it("should show error when submitting without password", async () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe(
      "Please enter email and password",
    );
    expect(mockSignInWithEmail).not.toHaveBeenCalled();
  });

  it("should successfully submit login form", async () => {
    mockSignInWithEmail.mockResolvedValue(undefined);
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(result.current.formState.error).toBeNull();
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should set loading state during submission", async () => {
    let resolveSignIn: () => void;
    const signInPromise = new Promise<void>((resolve) => {
      resolveSignIn = resolve;
    });
    mockSignInWithEmail.mockReturnValue(signInPromise);

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    // Start submission without awaiting
    void act(async () => {
      await result.current.handleSubmit();
    });

    // Wait for loading state to update
    await waitFor(() => {
      expect(result.current.formState.isLoading).toBe(true);
    });

    act(() => {
      resolveSignIn!();
    });

    await waitFor(() => {
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should handle submission error", async () => {
    const errorMessage = "Invalid credentials";
    mockSignInWithEmail.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("wrong-password");
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
    mockSignInWithEmail.mockRejectedValue("String error");
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.formState.error).toBe("Failed to sign in");
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
    mockSignInWithEmail.mockRejectedValue(new Error("Network error"));
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
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
