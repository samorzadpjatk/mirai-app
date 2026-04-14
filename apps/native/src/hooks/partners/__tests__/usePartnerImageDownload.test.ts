/**
 * @jest-environment node
 */

describe("[UNIT] usePartnerImageDownload", () => {
  test("module exports usePartnerImageDownload function", async () => {
    const { usePartnerImageDownload } =
      await import("../usePartnerImageDownload");
    expect(usePartnerImageDownload).toBeDefined();
    expect(typeof usePartnerImageDownload).toBe("function");
  });
});
