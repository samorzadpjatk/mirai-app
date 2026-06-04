import { afterEach, vi } from "vitest";

vi.mock("@mirai-app/shared/utils", () => ({
  logger: {
    info: vi.fn((...args: unknown[]) => console.log(...args)),
    error: vi.fn((...args: unknown[]) => console.error(...args)),
    warn: vi.fn((...args: unknown[]) => console.warn(...args)),
    debug: vi.fn((...args: unknown[]) => console.debug(...args)),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});
