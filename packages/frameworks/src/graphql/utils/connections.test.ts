/**
 * Tests for GraphQL Connection Helpers
 *
 * @see https://relay.dev/graphql/connections.htm
 */

import { describe, it, expect } from "bun:test";
import {
  decodeCursorWithDate,
  buildConnectionResponse,
  buildEdges,
  buildPageInfo,
  createEmptyConnection,
  clampFirst,
  PAGINATION_LIMITS,
  type ConnectionItem,
  type GatewayConnectionResult,
} from "./connections";
import {
  encodeCursor,
  type CursorData,
} from "@mirai-app/use-cases/system/utils/cursor";

describe("[UNIT] decodeCursorWithDate", () => {
  it("returns null for null cursor", () => {
    const result = decodeCursorWithDate(null);
    expect(result).toBeNull();
  });

  it("returns null for undefined cursor", () => {
    const result = decodeCursorWithDate(undefined);
    expect(result).toBeNull();
  });

  it("decodes valid cursor with createdAt as Date", () => {
    const cursorData: CursorData = {
      id: "abc123",
      createdAt: "2024-01-15T10:00:00Z",
    };
    const cursor = encodeCursor(cursorData);

    const result = decodeCursorWithDate(cursor);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("abc123");
    expect(result?.createdAt).toBeInstanceOf(Date);
    expect(result?.createdAt.toISOString()).toBe("2024-01-15T10:00:00.000Z");
  });

  it("preserves extra fields in cursor data", () => {
    const cursorData: CursorData = {
      id: "abc123",
      createdAt: "2024-01-15T10:00:00Z",
      isPinned: true,
      customField: "value",
    };
    const cursor = encodeCursor(cursorData);

    const result = decodeCursorWithDate(cursor);

    expect(result?.id).toBe("abc123");
    expect(result?.isPinned).toBe(true);
    expect(result?.customField).toBe("value");
  });

  it("returns null for invalid base64", () => {
    const result = decodeCursorWithDate("invalid-base64!!!");
    expect(result).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    const invalidCursor = Buffer.from("not-valid-json").toString("base64url");
    const result = decodeCursorWithDate(invalidCursor);
    expect(result).toBeNull();
  });

  it("returns null for cursor missing id field", () => {
    const cursorData = { createdAt: "2024-01-15T10:00:00Z" };
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString(
      "base64url",
    );

    const result = decodeCursorWithDate(cursor);
    expect(result).toBeNull();
  });

  it("returns null for cursor missing createdAt field", () => {
    const cursorData = { id: "abc123" };
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString(
      "base64url",
    );

    const result = decodeCursorWithDate(cursor);
    expect(result).toBeNull();
  });

  it("returns null for cursor with non-string id", () => {
    const cursorData = { id: 123, createdAt: "2024-01-15T10:00:00Z" };
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString(
      "base64url",
    );

    const result = decodeCursorWithDate(cursor);
    expect(result).toBeNull();
  });

  it("returns null for cursor with non-string createdAt", () => {
    const cursorData = { id: "abc123", createdAt: 1234567890 };
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString(
      "base64url",
    );

    const result = decodeCursorWithDate(cursor);
    expect(result).toBeNull();
  });
});

describe("[UNIT] buildEdges", () => {
  it("builds edges from items with cursors", () => {
    const items: ConnectionItem[] = [
      { id: "1", createdAt: new Date("2024-01-15T10:00:00Z"), name: "Item 1" },
      { id: "2", createdAt: new Date("2024-01-15T11:00:00Z"), name: "Item 2" },
    ];
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const edges = buildEdges(items, encodeFn);

    expect(edges).toHaveLength(2);
    expect(edges[0]!.node).toEqual(items[0]!);
    expect(edges[1]!.node).toEqual(items[1]!);
    expect(edges[0]!.cursor).toBeTruthy();
    expect(edges[1]!.cursor).toBeTruthy();
  });

  it("returns empty array for empty items", () => {
    const items: ConnectionItem[] = [];
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const edges = buildEdges(items, encodeFn);

    expect(edges).toHaveLength(0);
  });

  it("encodes unique cursor for each item", () => {
    const items: ConnectionItem[] = [
      { id: "1", createdAt: new Date("2024-01-15T10:00:00Z") },
      { id: "2", createdAt: new Date("2024-01-15T11:00:00Z") },
    ];
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const edges = buildEdges(items, encodeFn);

    expect(edges[0]!.cursor).not.toBe(edges[1]!.cursor);
  });
});

describe("[UNIT] buildPageInfo", () => {
  it("builds pageInfo with correct flags", () => {
    const edges = [
      { node: { id: "1" }, cursor: "cursor1" },
      { node: { id: "2" }, cursor: "cursor2" },
    ];

    const pageInfo = buildPageInfo(edges, true, false);

    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.startCursor).toBe("cursor1");
    expect(pageInfo.endCursor).toBe("cursor2");
  });

  it("sets hasNextPage to false when no more items", () => {
    const edges = [{ node: { id: "1" }, cursor: "cursor1" }];

    const pageInfo = buildPageInfo(edges, false, true);

    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.hasPreviousPage).toBe(true);
  });

  it("returns null cursors for empty edges", () => {
    const edges: Array<{ node: unknown; cursor: string }> = [];

    const pageInfo = buildPageInfo(edges, false, false);

    expect(pageInfo.startCursor).toBeNull();
    expect(pageInfo.endCursor).toBeNull();
    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.hasPreviousPage).toBe(false);
  });

  it("sets both flags to false for single page result", () => {
    const edges = [{ node: { id: "1" }, cursor: "cursor1" }];

    const pageInfo = buildPageInfo(edges, false, false);

    expect(pageInfo.hasNextPage).toBe(false);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.startCursor).toBe("cursor1");
    expect(pageInfo.endCursor).toBe("cursor1");
  });
});

describe("[UNIT] buildConnectionResponse", () => {
  it("builds complete connection from gateway result", () => {
    const items: ConnectionItem[] = [
      { id: "1", createdAt: new Date("2024-01-15T10:00:00Z"), name: "Item 1" },
      { id: "2", createdAt: new Date("2024-01-15T11:00:00Z"), name: "Item 2" },
    ];
    const result: GatewayConnectionResult<ConnectionItem> = {
      items,
      hasMore: true,
    };
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const connection = buildConnectionResponse(result, false, encodeFn);

    expect(connection.edges).toHaveLength(2);
    expect(connection.nodes).toEqual(items);
    expect(connection.pageInfo.hasNextPage).toBe(true);
    expect(connection.pageInfo.hasPreviousPage).toBe(false);
    expect(connection.pageInfo.startCursor).toBeTruthy();
    expect(connection.pageInfo.endCursor).toBeTruthy();
  });

  it("sets hasPreviousPage when after cursor is provided", () => {
    const items: ConnectionItem[] = [
      { id: "3", createdAt: new Date("2024-01-15T12:00:00Z") },
    ];
    const result: GatewayConnectionResult<ConnectionItem> = {
      items,
      hasMore: false,
    };
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const connection = buildConnectionResponse(result, true, encodeFn);

    expect(connection.pageInfo.hasPreviousPage).toBe(true);
    expect(connection.pageInfo.hasNextPage).toBe(false);
  });

  it("returns empty connection for empty items", () => {
    const result: GatewayConnectionResult<ConnectionItem> = {
      items: [],
      hasMore: false,
    };
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const connection = buildConnectionResponse(result, false, encodeFn);

    expect(connection.edges).toHaveLength(0);
    expect(connection.nodes).toHaveLength(0);
    expect(connection.pageInfo.hasNextPage).toBe(false);
    expect(connection.pageInfo.hasPreviousPage).toBe(false);
    expect(connection.pageInfo.startCursor).toBeNull();
    expect(connection.pageInfo.endCursor).toBeNull();
  });

  it("correctly maps nodes to match items", () => {
    const items: ConnectionItem[] = [
      { id: "1", createdAt: new Date("2024-01-15T10:00:00Z"), custom: "data" },
      { id: "2", createdAt: new Date("2024-01-15T11:00:00Z"), other: 123 },
    ];
    const result: GatewayConnectionResult<ConnectionItem> = {
      items,
      hasMore: false,
    };
    const encodeFn = (item: ConnectionItem) =>
      encodeCursor({ id: item.id, createdAt: item.createdAt.toISOString() });

    const connection = buildConnectionResponse(result, false, encodeFn);

    expect(connection.nodes[0]!.custom).toBe("data");
    expect(connection.nodes[1]!.other).toBe(123);
    expect(connection.nodes).toEqual(items);
  });
});

describe("[UNIT] createEmptyConnection", () => {
  it("returns empty connection structure", () => {
    const connection = createEmptyConnection<ConnectionItem>();

    expect(connection.edges).toEqual([]);
    expect(connection.nodes).toEqual([]);
    expect(connection.pageInfo.hasNextPage).toBe(false);
    expect(connection.pageInfo.hasPreviousPage).toBe(false);
    expect(connection.pageInfo.startCursor).toBeNull();
    expect(connection.pageInfo.endCursor).toBeNull();
  });

  it("works with any type parameter", () => {
    interface CustomItem {
      id: string;
      name: string;
    }

    const connection = createEmptyConnection<CustomItem>();

    expect(connection.edges).toEqual([]);
    expect(connection.nodes).toEqual([]);
  });
});

describe("[UNIT] clampFirst", () => {
  it("returns default for undefined", () => {
    const result = clampFirst(undefined);
    expect(result).toBe(PAGINATION_LIMITS.DEFAULT_FIRST);
  });

  it("returns default for null", () => {
    const result = clampFirst(null);
    expect(result).toBe(PAGINATION_LIMITS.DEFAULT_FIRST);
  });

  it("returns the value when within range", () => {
    const result = clampFirst(50);
    expect(result).toBe(50);
  });

  it("caps at MAX_FIRST when value exceeds limit", () => {
    const result = clampFirst(200);
    expect(result).toBe(PAGINATION_LIMITS.MAX_FIRST);
  });

  it("raises to MIN_FIRST when value below minimum", () => {
    const result = clampFirst(0);
    expect(result).toBe(PAGINATION_LIMITS.MIN_FIRST);
  });

  it("handles negative values", () => {
    const result = clampFirst(-10);
    expect(result).toBe(PAGINATION_LIMITS.MIN_FIRST);
  });

  it("handles exact MAX_FIRST boundary", () => {
    const result = clampFirst(PAGINATION_LIMITS.MAX_FIRST);
    expect(result).toBe(PAGINATION_LIMITS.MAX_FIRST);
  });

  it("handles exact MIN_FIRST boundary", () => {
    const result = clampFirst(PAGINATION_LIMITS.MIN_FIRST);
    expect(result).toBe(PAGINATION_LIMITS.MIN_FIRST);
  });
});

describe("[UNIT] PAGINATION_LIMITS", () => {
  it("has correct default value", () => {
    expect(PAGINATION_LIMITS.DEFAULT_FIRST).toBe(20);
  });

  it("has correct max value", () => {
    expect(PAGINATION_LIMITS.MAX_FIRST).toBe(100);
  });

  it("has correct min value", () => {
    expect(PAGINATION_LIMITS.MIN_FIRST).toBe(1);
  });
});

describe("[UNIT] Integration: Encode -> Decode Roundtrip", () => {
  it("preserves cursor data through encode/decode cycle", () => {
    const original: CursorData = {
      id: "test-123",
      createdAt: "2024-06-01T12:30:45Z",
      extraField: "custom value",
    };

    const cursor = encodeCursor(original);
    const decoded = decodeCursorWithDate(cursor);

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(original.id);
    expect(decoded?.createdAt.toISOString()).toBe("2024-06-01T12:30:45.000Z");
    expect(decoded?.extraField).toBe("custom value");
  });

  it("handles various date formats", () => {
    const testDates = [
      "2024-01-01T00:00:00Z",
      "2024-12-31T23:59:59Z",
      "2024-06-15T12:30:00.000Z",
    ];

    for (const dateStr of testDates) {
      const original: CursorData = {
        id: "test",
        createdAt: dateStr,
      };

      const cursor = encodeCursor(original);
      const decoded = decodeCursorWithDate(cursor);

      expect(decoded?.createdAt.toISOString()).toBe(
        new Date(dateStr).toISOString(),
      );
    }
  });
});
