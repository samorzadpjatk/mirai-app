import { describe, it, expect } from "bun:test";
import type {
  CursorPaginationOptions,
  CursorPaginatedResult,
} from "./pagination";
import type { CursorData } from "../utils/cursor";

describe("[UNIT] Cursor Pagination Types", () => {
  it("CursorPaginationOptions interface accepts valid options", () => {
    const cursor: CursorData = {
      id: "abc123",
      createdAt: "2024-01-15T10:00:00Z",
    };

    const options: CursorPaginationOptions = {
      limit: 20,
      cursor,
    };

    expect(options.limit).toBe(20);
    expect(options.cursor?.id).toBe("abc123");
    expect(options.cursor?.createdAt).toBe("2024-01-15T10:00:00Z");
  });

  it("CursorPaginationOptions works without cursor", () => {
    const options: CursorPaginationOptions = {
      limit: 50,
    };

    expect(options.limit).toBe(50);
    expect(options.cursor).toBeUndefined();
  });

  it("CursorPaginatedResult interface accepts valid result", () => {
    const nextCursor: CursorData = {
      id: "def456",
      createdAt: "2024-01-15T11:00:00Z",
    };

    const result: CursorPaginatedResult<string> = {
      items: ["item1", "item2", "item3"],
      nextCursor,
      hasMore: true,
    };

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor?.id).toBe("def456");
  });

  it("CursorPaginatedResult works without nextCursor", () => {
    const result: CursorPaginatedResult<number> = {
      items: [1, 2, 3],
      hasMore: false,
    };

    expect(result.items).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it("CursorPaginatedResult can be used with complex types", () => {
    interface UserDTO {
      id: string;
      name: string;
      email: string;
    }

    const nextCursor: CursorData = {
      id: "user-123",
      createdAt: "2024-01-15T10:00:00Z",
      extraField: "custom value",
    };

    const result: CursorPaginatedResult<UserDTO> = {
      items: [
        { id: "user-1", name: "Alice", email: "alice@example.com" },
        { id: "user-2", name: "Bob", email: "bob@example.com" },
      ],
      nextCursor,
      hasMore: true,
    };

    expect(result.items[0]?.name).toBe("Alice");
    expect(result.nextCursor?.extraField).toBe("custom value");
  });
});
