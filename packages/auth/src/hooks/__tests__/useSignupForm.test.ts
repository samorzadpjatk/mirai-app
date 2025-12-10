import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSignupForm } from "../useSignupForm";
import { useAuth } from "../../authHooks";

vi.mock("../../authHooks", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

type AuthContextValue = ReturnType<typeof useAuth>;

describe("useSignupForm", () => {
  const mockSignUpWithEmail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      signUpWithEmail: mockSignUpWithEmail,
    } as unknown as AuthContextValue);
  });

  it("should initialize with empty form state", () => {
    const { result } = renderHook(() => useSignupForm());

    expect(result.current.formState).toEqual({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      isLoading: false,
      error: null,
      success: false,
    });
  });

  it("should update name field", () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
    });

    expect(result.current.formState.name).toBe("John Doe");
  });

  it("should update email field", () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    expect(result.current.formState.email).toBe("test@example.com");
  });

  it("should update password field", () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setPassword("password123");
    });

    expect(result.current.formState.password).toBe("password123");
  });

  it("should update confirmPassword field", () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setConfirmPassword("password123");
    });

    expect(result.current.formState.confirmPassword).toBe("password123");
  });

  it("should validate empty name", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Please enter your name");
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should validate name with only whitespace", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("   ");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Please enter your name");
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should validate invalid email", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("invalid-email");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Please enter a valid email");
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should validate password length", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("12345");
      result.current.setConfirmPassword("12345");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe(
      "Password must be at least 6 characters",
    );
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should validate password match", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("different123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Passwords do not match");
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should successfully submit signup form", async () => {
    mockSignUpWithEmail.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    await waitFor(() => {
      expect(mockSignUpWithEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        metadata: { name: "John Doe" },
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(result.current.formState.success).toBe(true);
      expect(result.current.formState.error).toBeNull();
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should set loading state during submission", async () => {
    let resolveSignUp: () => void;
    const signUpPromise = new Promise<void>((resolve) => {
      resolveSignUp = resolve;
    });
    mockSignUpWithEmail.mockReturnValue(signUpPromise);

    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
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

    // Resolve the sign up
    resolveSignUp!();

    // Wait for submission to complete
    await act(async () => {
      await submitPromise!;
    });

    // Loading should be false after completion
    expect(result.current.formState.isLoading).toBe(false);
  });

  it("should handle submission error", async () => {
    const errorMessage = "Email already exists";
    mockSignUpWithEmail.mockRejectedValue(new Error(errorMessage));
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("existing@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.formState.error).toBe(errorMessage);
      expect(result.current.formState.success).toBe(false);
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should handle non-Error exceptions", async () => {
    mockSignUpWithEmail.mockRejectedValue("String error");
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.formState.error).toBe("Failed to sign up");
      expect(result.current.formState.isLoading).toBe(false);
    });
  });

  it("should clear error message", async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("");
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

  it("should not call onSuccess if validation fails", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("invalid-email");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockSignUpWithEmail).not.toHaveBeenCalled();
  });

  it("should not call onSuccess if submission fails", async () => {
    mockSignUpWithEmail.mockRejectedValue(new Error("Network error"));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSignupForm());

    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("test@example.com");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit(onSuccess);
    });

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
      expect(result.current.formState.error).toBe("Network error");
    });
  });

  it("should clear previous errors before validation", async () => {
    const { result } = renderHook(() => useSignupForm());

    // First submission with error
    act(() => {
      result.current.setName("");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBeTruthy();

    // Second submission should clear previous error before validating
    act(() => {
      result.current.setName("John Doe");
      result.current.setEmail("invalid-email");
      result.current.setPassword("password123");
      result.current.setConfirmPassword("password123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Should have new validation error, not old one
    expect(result.current.formState.error).toBe("Please enter a valid email");
  });
});
