import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useSupabase } from "../../supabase/useSupabase";

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
  it("should return the Supabase client from context", () => {
    const { result } = renderHook(() => useSupabase());

    expect(result.current).toBe(mockSupabaseClient);
    expect(result.current.auth.getSession).toBeDefined();
    expect(result.current.from).toBeDefined();
    expect(result.current.storage.from).toBeDefined();
  });
});
