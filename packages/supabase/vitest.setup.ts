import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => {
  const mockSupabaseClient = {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };

  return {
    createClient: vi.fn(() => mockSupabaseClient),
  };
});

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
