import { vi } from "vitest";

export const joinPath = vi.fn((...parts: string[]) => parts.join("/"));
