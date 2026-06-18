import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLoginForm } from "../hooks/useLoginForm";

describe("useLoginForm behavior", () => {
  it("should initialize with empty state", () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.formState.email).toBe("");
    expect(result.current.formState.isLoading).toBe(false);
    expect(result.current.formState.isSent).toBe(false);
    expect(result.current.formState.error).toBeNull();
  });

  it("should set email", () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.setEmail("test@example.com");
    });

    expect(result.current.formState.email).toBe("test@example.com");
  });

  it("should show error when submitting with empty email", async () => {
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formState.error).toBe("Please enter your email");
    expect(result.current.formState.isLoading).toBe(false);
  });
});
