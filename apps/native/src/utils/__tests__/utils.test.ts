/**
 * @jest-environment node
 */

// Tests for native utilities

describe("validation utilities", () => {
  test("exports formatDate function", async () => {
    const { formatDate } = await import("../validation");
    expect(formatDate).toBeDefined();
    expect(typeof formatDate).toBe("function");
  });

  test("exports getInitials function", async () => {
    const { getInitials } = await import("../validation");
    expect(getInitials).toBeDefined();
    expect(typeof getInitials).toBe("function");
  });

  test("getInitials returns correct initials", async () => {
    const { getInitials } = await import("../validation");
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Alice")).toBe("A");
    expect(getInitials("")).toBe("?");
    expect(getInitials("  Bob Smith  ")).toBe("BS");
  });
});

describe("format utilities", () => {
  test("exports formatDate function", async () => {
    const { formatDate } = await import("../format");
    expect(formatDate).toBeDefined();
    expect(typeof formatDate).toBe("function");
  });

  test("exports formatCurrency function", async () => {
    const { formatCurrency } = await import("../format");
    expect(formatCurrency).toBeDefined();
    expect(typeof formatCurrency).toBe("function");
  });

  test("exports formatRelativeTime function", async () => {
    const { formatRelativeTime } = await import("../format");
    expect(formatRelativeTime).toBeDefined();
    expect(typeof formatRelativeTime).toBe("function");
  });

  test("formatCurrency formats PLN currency", async () => {
    const { formatCurrency } = await import("../format");
    const result = formatCurrency(100);
    expect(result).toContain("100");
    expect(result).toContain("zł");
  });
});

describe("trip utilities", () => {
  test("exports isTripPast function", async () => {
    const { isTripPast } = await import("../trip");
    expect(isTripPast).toBeDefined();
    expect(typeof isTripPast).toBe("function");
  });

  test("exports isTripOngoing function", async () => {
    const { isTripOngoing } = await import("../trip");
    expect(isTripOngoing).toBeDefined();
    expect(typeof isTripOngoing).toBe("function");
  });

  test("exports isTripUpcoming function", async () => {
    const { isTripUpcoming } = await import("../trip");
    expect(isTripUpcoming).toBeDefined();
    expect(typeof isTripUpcoming).toBe("function");
  });

  test("exports getTripStatus function", async () => {
    const { getTripStatus } = await import("../trip");
    expect(getTripStatus).toBeDefined();
    expect(typeof getTripStatus).toBe("function");
  });

  test("isTripPast returns true for past dates", async () => {
    const { isTripPast } = await import("../trip");
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isTripPast(pastDate)).toBe(true);
    expect(isTripPast(pastDate.toISOString())).toBe(true);
  });

  test("isTripUpcoming returns true for future dates", async () => {
    const { isTripUpcoming } = await import("../trip");
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isTripUpcoming(futureDate)).toBe(true);
    expect(isTripUpcoming(futureDate.toISOString())).toBe(true);
  });
});

describe("image utilities", () => {
  test("exports getImageExtension function", async () => {
    const { getImageExtension } = await import("../image");
    expect(getImageExtension).toBeDefined();
    expect(typeof getImageExtension).toBe("function");
  });

  test("exports getImageContentType function", async () => {
    const { getImageContentType } = await import("../image");
    expect(getImageContentType).toBeDefined();
    expect(typeof getImageContentType).toBe("function");
  });

  test("getImageContentType returns correct MIME types", async () => {
    const { getImageContentType } = await import("../image");
    expect(getImageContentType("png")).toBe("image/png");
    expect(getImageContentType("webp")).toBe("image/webp");
    expect(getImageContentType("jpg")).toBe("image/jpeg");
    expect(getImageContentType("jpeg")).toBe("image/jpeg");
    expect(getImageContentType("heic")).toBe("image/heic");
  });
});
