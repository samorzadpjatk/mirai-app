/**
 * @jest-environment node
 */

describe("useFileUpload", () => {
  test("module exports useFileUpload function", async () => {
    const { useFileUpload } = await import("../useFileUpload");
    expect(useFileUpload).toBeDefined();
    expect(typeof useFileUpload).toBe("function");
  });
});

describe("useFileDownload", () => {
  test("module exports useFileDownload function", async () => {
    const { useFileDownload } = await import("../useFileDownload");
    expect(useFileDownload).toBeDefined();
    expect(typeof useFileDownload).toBe("function");
  });
});
