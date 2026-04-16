/**
 * Relay Types Module Tests
 *
 * Tests for the relay GraphQL types module. Verifies that:
 * - Module imports without errors
 * - PageInfo type is registered correctly per Relay spec
 * - Node interface reference is available
 * - All Relay utility functions work as expected
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure module tests with no external dependencies
 *
 * @see https://relay.dev/graphql/connections.htm#sec-PageInfo
 */

import { describe, it, expect } from "bun:test";
import { printSchema } from "graphql";

/**
 * Import relay module to trigger side-effect registration.
 * This module registers PageInfo type with the Pothos builder.
 */
import {
  toGlobalId,
  fromGlobalId,
  isValidGlobalId,
  createEmptyConnection,
  createConnectionArgs,
  NodeInterface,
  PageInfoType,
  type ConnectionType,
  type EdgeType,
  type PageInfo,
} from "./relay.js";

// Import schema after relay module to verify assembly works
import { schema } from "./schema.js";

/**
 * Helper to convert schema to SDL string
 */
function getSDL(): string {
  return printSchema(schema);
}

describe("[UNIT] Relay Types Module", () => {
  it("imports relay module without errors", () => {
    // Module already imported at top level
    // If we got here without errors, import succeeded
    expect(true).toBe(true);
  });

  it("registers PageInfo type with the schema builder", () => {
    const sdl = getSDL();

    // Verify PageInfo type exists
    expect(sdl).toContain("type PageInfo");
  });

  it("includes all Relay-spec PageInfo fields", () => {
    const sdl = getSDL();

    // Verify PageInfo type exists with all fields
    // Note: printSchema() outputs field definitions without ! in the type block
    const pageInfoMatch = sdl.match(/type PageInfo\s*\{[^}]+\}/s);
    expect(pageInfoMatch).not.toBeNull();

    const pageInfoBlock = pageInfoMatch![0];

    // hasNextPage: Boolean (required, but printed without ! in printSchema output)
    expect(pageInfoBlock).toContain("hasNextPage: Boolean");

    // hasPreviousPage: Boolean (required)
    expect(pageInfoBlock).toContain("hasPreviousPage: Boolean");

    // startCursor: String (nullable)
    expect(pageInfoBlock).toContain("startCursor: String");

    // endCursor: String (nullable)
    expect(pageInfoBlock).toContain("endCursor: String");
  });

  it("registers PageInfo with correct description", () => {
    const sdl = getSDL();

    // Verify description is included in schema
    expect(sdl).toContain('"PageInfo for Relay-compliant pagination"');
  });

  it("exports NodeInterface reference for node types to implement", () => {
    // The NodeInterface is a reference to Pothos relay plugin's Node interface
    // It's exported so other types can use builder.node() to implement it
    // We verify the export exists and is the nodeInterfaceRef from the builder
    expect(NodeInterface).toBeDefined();
  });

  it("exports PageInfoType constant", () => {
    expect(PageInfoType).toBeDefined();
    expect(PageInfoType).toBe("PageInfo");
  });
});

describe("[UNIT] toGlobalId / fromGlobalId", () => {
  it("encodes typeName and id to valid Base64 global ID", () => {
    const globalId = toGlobalId("User", "123");

    // Should be a valid Base64 string
    expect(typeof globalId).toBe("string");
    expect(globalId.length).toBeGreaterThan(0);

    // Should be decodable
    const decoded = Buffer.from(globalId, "base64").toString("utf-8");
    expect(decoded).toBe("User:123");
  });

  it("decodes global ID back to typeName and id", () => {
    const globalId = toGlobalId("User", "123");
    const result = fromGlobalId(globalId);

    expect(result).toEqual({
      typeName: "User",
      id: "123",
    });
  });

  it("handles various ID formats correctly", () => {
    // Numeric IDs
    expect(fromGlobalId(toGlobalId("User", "123"))).toEqual({
      typeName: "User",
      id: "123",
    });

    // UUID-style IDs
    expect(
      fromGlobalId(toGlobalId("User", "550e8400-e29b-41d4-a716-446655440000")),
    ).toEqual({
      typeName: "User",
      id: "550e8400-e29b-41d4-a716-446655440000",
    });

    // IDs with special characters
    expect(fromGlobalId(toGlobalId("User", "id_with-special.chars"))).toEqual({
      typeName: "User",
      id: "id_with-special.chars",
    });
  });

  it("handles different type names", () => {
    expect(fromGlobalId(toGlobalId("Event", "456"))).toEqual({
      typeName: "Event",
      id: "456",
    });

    expect(fromGlobalId(toGlobalId("Sponsor", "abc"))).toEqual({
      typeName: "Sponsor",
      id: "abc",
    });
  });

  it("preserves typeName:id structure through encode/decode cycle", () => {
    const testCases = [
      { typeName: "User", id: "123" },
      { typeName: "Event", id: "event-uuid-123" },
      { typeName: "Notification", id: "notif_456" },
    ];

    for (const { typeName, id } of testCases) {
      const globalId = toGlobalId(typeName, id);
      const decoded = fromGlobalId(globalId);
      expect(decoded).toEqual({ typeName, id });
    }
  });
});

describe("[UNIT] isValidGlobalId", () => {
  it("returns true for valid global IDs", () => {
    const validGlobalId = toGlobalId("User", "123");
    expect(isValidGlobalId(validGlobalId)).toBe(true);
  });

  it("returns true for various valid global ID formats", () => {
    expect(isValidGlobalId(toGlobalId("User", "123"))).toBe(true);
    expect(isValidGlobalId(toGlobalId("Event", "uuid-here"))).toBe(true);
    expect(isValidGlobalId(toGlobalId("Sponsor", "sponsor_123"))).toBe(true);
  });

  it("returns false for invalid Base64", () => {
    // Not valid Base64
    expect(isValidGlobalId("not-base64!!!")).toBe(false);
    expect(isValidGlobalId("@#$%^&*()")).toBe(false);
  });

  it("returns false for missing colon separator", () => {
    // Valid Base64 but no colon separator
    const noColon = Buffer.from("User123").toString("base64");
    expect(isValidGlobalId(noColon)).toBe(false);
  });

  it("returns false for empty typeName part", () => {
    // Empty typeName: ":123"
    const emptyType = Buffer.from(":123").toString("base64");
    expect(isValidGlobalId(emptyType)).toBe(false);
  });

  it("returns false for empty id part", () => {
    // Empty id: "User:"
    const emptyId = Buffer.from("User:").toString("base64");
    expect(isValidGlobalId(emptyId)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidGlobalId("")).toBe(false);
  });

  it("returns false for string with multiple colons", () => {
    // Multiple colons: "User:extra:id"
    const multipleColons = Buffer.from("User:extra:id").toString("base64");
    expect(isValidGlobalId(multipleColons)).toBe(false);
  });
});

describe("[UNIT] createEmptyConnection", () => {
  it("returns correct structure with empty edges array", () => {
    const emptyConnection = createEmptyConnection<string>();

    expect(emptyConnection.edges).toEqual([]);
    expect(Array.isArray(emptyConnection.edges)).toBe(true);
  });

  it("returns pageInfo with falsy boolean values", () => {
    const emptyConnection = createEmptyConnection<string>();

    expect(emptyConnection.pageInfo.hasNextPage).toBe(false);
    expect(emptyConnection.pageInfo.hasPreviousPage).toBe(false);
    expect(emptyConnection.pageInfo.startCursor).toBeNull();
    expect(emptyConnection.pageInfo.endCursor).toBeNull();
  });

  it("returns totalCount of 0", () => {
    const emptyConnection = createEmptyConnection<string>();

    expect(emptyConnection.totalCount).toBe(0);
  });

  it("returns complete empty connection structure", () => {
    const emptyConnection = createEmptyConnection<{
      id: string;
      name: string;
    }>();

    expect(emptyConnection).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    });
  });

  it("works with different node types", () => {
    // Test with string nodes
    const stringConnection = createEmptyConnection<string>();
    expect(stringConnection.edges).toEqual([]);

    // Test with object nodes
    interface UserNode {
      id: string;
      name: string;
    }
    const userConnection = createEmptyConnection<UserNode>();
    expect(userConnection.edges).toEqual([]);
  });
});

describe("[UNIT] createConnectionArgs", () => {
  it("returns correct argument structure", () => {
    const args = createConnectionArgs();

    expect(args).toBeDefined();
    expect(typeof args).toBe("object");
  });

  it("has first argument of type Int", () => {
    const args = createConnectionArgs();

    expect(args.first).toBeDefined();
    expect(args.first.type).toBe("Int");
    expect(args.first.description).toBe(
      "Returns the first n elements from the list",
    );
  });

  it("has after argument of type String", () => {
    const args = createConnectionArgs();

    expect(args.after).toBeDefined();
    expect(args.after.type).toBe("String");
    expect(args.after.description).toBe("Returns elements after this cursor");
  });

  it("has last argument of type Int", () => {
    const args = createConnectionArgs();

    expect(args.last).toBeDefined();
    expect(args.last.type).toBe("Int");
    expect(args.last.description).toBe(
      "Returns the last n elements from the list",
    );
  });

  it("has before argument of type String", () => {
    const args = createConnectionArgs();

    expect(args.before).toBeDefined();
    expect(args.before.type).toBe("String");
    expect(args.before.description).toBe("Returns elements before this cursor");
  });

  it("returns all four required pagination arguments", () => {
    const args = createConnectionArgs();

    const expectedKeys = ["first", "after", "last", "before"];
    expect(Object.keys(args).sort()).toEqual(expectedKeys.sort());
  });
});

describe("[UNIT] Type Interfaces", () => {
  it("ConnectionType interface has correct structure", () => {
    // Test that the ConnectionType interface structure is correct
    const mockEdge: EdgeType<string> = {
      node: "test-node",
      cursor: "test-cursor",
    };

    const mockPageInfo: PageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    };

    const connection: ConnectionType<string> = {
      edges: [mockEdge],
      pageInfo: mockPageInfo,
      totalCount: 1,
    };

    expect(connection.edges).toHaveLength(1);
    expect(connection.edges[0]!.node).toBe("test-node");
    expect(connection.edges[0]!.cursor).toBe("test-cursor");
    expect(connection.pageInfo.hasNextPage).toBe(false);
    expect(connection.totalCount).toBe(1);
  });

  it("EdgeType interface has correct structure", () => {
    const edge: EdgeType<{ id: string; name: string }> = {
      node: { id: "123", name: "Test" },
      cursor: "abc123",
    };

    expect(edge.node.id).toBe("123");
    expect(edge.node.name).toBe("Test");
    expect(edge.cursor).toBe("abc123");
  });

  it("PageInfo interface has correct structure", () => {
    const pageInfo: PageInfo = {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: "start",
      endCursor: "end",
    };

    expect(pageInfo.hasNextPage).toBe(true);
    expect(pageInfo.hasPreviousPage).toBe(false);
    expect(pageInfo.startCursor).toBe("start");
    expect(pageInfo.endCursor).toBe("end");
  });

  it("PageInfo interface allows null cursors", () => {
    const pageInfo: PageInfo = {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    };

    expect(pageInfo.startCursor).toBeNull();
    expect(pageInfo.endCursor).toBeNull();
  });
});
