import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Suppress expected console output during tests
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

const shouldSuppress = (message: string): boolean => {
  const suppressedPatterns = [/\[Supabase\]/, /Creating client with URL/];
  return suppressedPatterns.some((pattern) => pattern.test(message));
};

console.log = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalConsoleLog.apply(console, args);
  }
};

console.info = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalConsoleInfo.apply(console, args);
  }
};

console.debug = (...args: unknown[]) => {
  const message = args[0]?.toString() || "";
  if (!shouldSuppress(message)) {
    originalConsoleDebug.apply(console, args);
  }
};

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
