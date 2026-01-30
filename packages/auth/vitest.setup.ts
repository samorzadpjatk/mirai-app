import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),

    refreshSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
});

const sharedSupabaseClient = createMockSupabaseClient();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => sharedSupabaseClient),
}));

vi.mock("@integral-2025-app/supabase", () => ({
  supabase: sharedSupabaseClient,
  createServerSupabaseClient: vi.fn(() => Promise.resolve(sharedSupabaseClient)),
}));
