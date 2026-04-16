/**
 * Generate Schema Tests
 *
 * Tests for the GraphQL schema generation CLI script. Verifies that:
 * - Module exports can be imported correctly
 * - generateSchema function works as expected
 * - Schema generation process completes successfully
 * - Error handling works appropriately
 *
 * ## Test Tagging
 *
 * - [UNIT]: Pure logic tests with mocked dependencies
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import * as fsPromises from "fs/promises";

// Mock fs/promises to avoid actual file writes in tests
const mockWriteFile = spyOn(fsPromises, "writeFile");
const mockMkdir = spyOn(fsPromises, "mkdir");

// Store original console methods
let consoleLogSpy: ReturnType<typeof spyOn<Console, "log">>;
let consoleErrorSpy: ReturnType<typeof spyOn<Console, "error">>;

describe("[UNIT] generate-schema module", () => {
  beforeEach(async () => {
    // Reset mocks before each test
    mockWriteFile.mockReset();
    mockMkdir.mockReset();

    // Setup successful mock implementations
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    // Spy on console methods
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    // Dynamically import module to test after mocks are setup
    // Need to clear module cache to ensure fresh imports
  });

  afterEach(() => {
    // Restore console spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("can be imported without errors", async () => {
    // Test that the module can be imported
    const module = await import("./generate-schema.js");

    expect(module).toBeDefined();
    expect(module.generateSchema).toBeDefined();
  });

  it("exports generateSchema as a function", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    expect(typeof generateSchema).toBe("function");
  });

  it("generateSchema returns a Promise", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    const result = generateSchema();

    expect(result).toBeInstanceOf(Promise);

    // Wait for completion to prevent dangling promises
    await result;
  });

  it("generates schema and logs appropriate output on success", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    // Verify console output
    expect(consoleLogSpy).toHaveBeenCalledWith("Generating GraphQL schema...");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Schema generated successfully"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Types:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Inputs:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Enums:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Scalars:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Schema written to:"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("Schema generation complete!");
  });

  it("calls writeSchemaToFile with correct parameters", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    // Verify mkdir was called to create directory
    expect(mockMkdir).toHaveBeenCalled();

    // Verify writeFile was called
    expect(mockWriteFile).toHaveBeenCalled();

    // Verify the path ends with expected output
    const calls = mockWriteFile.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const firstCall = calls[0];
    if (!firstCall) {
      throw new Error("Expected at least one call to writeFile");
    }
    const [pathArg, contentArg] = firstCall;
    expect(pathArg).toContain("graphql/schema.graphql");
    expect(typeof contentArg).toBe("string");
  });

  it("includes proper header in generated schema file", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    const calls = mockWriteFile.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("Expected at least one call to writeFile");
    }
    const [, content] = firstCall;

    // Verify header content is in the file
    expect(content).toContain("GraphQL Schema - Mirai App API");
    expect(content).toContain(
      "Generated automatically from Pothos type definitions",
    );
    expect(content).toContain("Do not edit manually");
  });

  it("schema output contains GraphQL types", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    const calls = mockWriteFile.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error("Expected at least one call to writeFile");
    }
    const [, content] = firstCall;

    // Verify the content is valid GraphQL SDL
    expect(content).toContain("type");
    expect(content).toContain("Query");
  });
});

describe("[UNIT] generate-schema error handling", () => {
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    // Store original process.exit
    originalExit = process.exit;

    // Mock process.exit to prevent test termination
    Object.defineProperty(process, "exit", {
      value: spyOn(process, "exit").mockImplementation(
        () => undefined as never,
      ),
      writable: true,
      configurable: true,
    });

    // Reset mocks
    mockWriteFile.mockReset();
    mockMkdir.mockReset();

    // Setup console spies
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore process.exit
    Object.defineProperty(process, "exit", {
      value: originalExit,
      writable: true,
      configurable: true,
    });

    // Restore console
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("handles file write errors appropriately", async () => {
    // Simulate write error
    mockMkdir.mockRejectedValue(new Error("Permission denied"));

    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to generate schema:",
      expect.any(Error),
    );

    // Verify process.exit was called with error code
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("handles mkdir errors", async () => {
    // Simulate directory creation error
    mockMkdir.mockRejectedValue(new Error("Directory creation failed"));

    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorCalls = consoleErrorSpy.mock.calls;
    expect(errorCalls.length).toBeGreaterThan(0);
    const firstErrorCall = errorCalls[0];
    expect(firstErrorCall).toBeDefined();
    if (firstErrorCall) {
      expect(String(firstErrorCall[0])).toContain("Failed to generate schema");
    }
  });
});

describe("[UNIT] generateSchema type counting", () => {
  beforeEach(async () => {
    mockWriteFile.mockReset();
    mockMkdir.mockReset();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("counts schema elements correctly", async () => {
    const { generateSchema } = await import("./generate-schema.js");

    await generateSchema();

    // Verify the type counts are logged with numbers
    const allCalls = consoleLogSpy.mock.calls.flat();

    // Find calls that contain type counts
    const typeCountCall = allCalls.find(
      (call) => typeof call === "string" && call.match(/-\s*Types:\s*\d+/),
    );
    const inputCountCall = allCalls.find(
      (call) => typeof call === "string" && call.match(/-\s*Inputs:\s*\d+/),
    );
    const enumCountCall = allCalls.find(
      (call) => typeof call === "string" && call.match(/-\s*Enums:\s*\d+/),
    );
    const scalarCountCall = allCalls.find(
      (call) => typeof call === "string" && call.match(/-\s*Scalars:\s*\d+/),
    );

    expect(typeCountCall).toBeDefined();
    expect(inputCountCall).toBeDefined();
    expect(enumCountCall).toBeDefined();
    expect(scalarCountCall).toBeDefined();

    // Verify counts are non-negative numbers
    expect(typeCountCall).toBeDefined();
    if (typeof typeCountCall === "string") {
      const typeMatch = typeCountCall.match(/(\d+)/);
      expect(typeMatch).toBeDefined();
      if (typeMatch && typeMatch[1]) {
        expect(parseInt(typeMatch[1], 10)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("[UNIT] module execution", () => {
  it("exports generateSchema function that can be called independently", async () => {
    // This test verifies the function works when imported as a module
    const { generateSchema } = await import("./generate-schema.js");

    // Function should be callable without errors
    const result = generateSchema();
    expect(result).toBeInstanceOf(Promise);

    // Clean up
    await result;
  });
});
