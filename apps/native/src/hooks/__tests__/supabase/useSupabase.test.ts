import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useSupabase } from "../../supabase/useSupabase";

// Create a mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(),
  storage: {
    from: jest.fn(),
  },
};

jest.mock("@mirai-app/supabase/react", () => ({
  useSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

describe("useSupabase", () => {
  it("should return the Supabase client", () => {
    const { result } = renderHook(() => useSupabase());

    expect(result.current).toBe(mockSupabaseClient);
  });

  it("should have auth methods available", () => {
    const { result } = renderHook(() => useSupabase());

    expect(result.current.auth).toBeDefined();
    expect(typeof result.current.auth.getSession).toBe("function");
    expect(typeof result.current.auth.signInWithPassword).toBe("function");
    expect(typeof result.current.auth.signOut).toBe("function");
  });

  it("should have storage methods available", () => {
    const { result } = renderHook(() => useSupabase());

    expect(result.current.storage).toBeDefined();
    expect(typeof result.current.storage.from).toBe("function");
  });

  it("should have from method for database queries", () => {
    const { result } = renderHook(() => useSupabase());

    expect(typeof result.current.from).toBe("function");
  });
});
