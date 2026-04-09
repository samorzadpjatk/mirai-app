/**
 * @jest-environment node
 */

describe("useFileUpload", () => {
  test("module exports useFileUpload function", () => {
    const { useFileUpload } = require("../useFileUpload");
    expect(useFileUpload).toBeDefined();
    expect(typeof useFileUpload).toBe("function");
  });
});

describe("useFileDownload", () => {
  test("module exports useFileDownload function", () => {
    const { useFileDownload } = require("../useFileDownload");
    expect(useFileDownload).toBeDefined();
    expect(typeof useFileDownload).toBe("function");
  });
});
