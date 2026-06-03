import { vi, afterEach } from "vitest";

vi.mock("@mirai-app/shared", () => ({
  logger: {
    info: vi.fn((...args: unknown[]) => console.log(...args)),
    error: vi.fn((...args: unknown[]) => console.error(...args)),
    warn: vi.fn((...args: unknown[]) => console.warn(...args)),
    debug: vi.fn((...args: unknown[]) => console.debug(...args)),
  },
  formatDisplayName: vi.fn(
    (firstName?: string | null, lastName?: string | null, fallback?: string | null) => {
      const parts = [firstName?.trim(), lastName?.trim()].filter(Boolean);
      if (parts.length > 0) return parts.join(" ");
      return fallback?.trim() ?? null;
    },
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
});
