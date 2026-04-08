import { describe, expect, test, beforeEach, mock } from "bun:test";

// Mock react-hot-toast
const mockToast = mock((message: string) => message);
const mockSuccess = mock((message: string) => message);
const mockError = mock((message: string) => message);
const mockLoading = mock((message: string) => message);
const mockDismiss = mock((id?: string) => undefined);

mock.module("react-hot-toast", () => ({
  toast: Object.assign(mockToast, {
    success: mockSuccess,
    error: mockError,
    loading: mockLoading,
    dismiss: mockDismiss,
  }),
}));

// Import after mock
import { appToast } from "../toast";

beforeEach(() => {
  mockToast.mockClear();
  mockSuccess.mockClear();
  mockError.mockClear();
  mockLoading.mockClear();
  mockDismiss.mockClear();
});

describe("appToast.success", () => {
  test("calls toast.success with message", () => {
    appToast.success("Operation successful!");

    expect(mockSuccess).toHaveBeenCalledTimes(1);
    expect(mockSuccess).toHaveBeenCalledWith("Operation successful!");
  });

  test("returns result from toast.success", () => {
    mockSuccess.mockReturnValue("toast-id-123");

    const result = appToast.success("Test message");

    expect(result).toBe("toast-id-123");
  });

  test("handles empty string message", () => {
    appToast.success("");

    expect(mockSuccess).toHaveBeenCalledWith("");
  });

  test("handles long messages", () => {
    const longMessage = "a".repeat(1000);
    appToast.success(longMessage);

    expect(mockSuccess).toHaveBeenCalledWith(longMessage);
  });
});

describe("appToast.error", () => {
  test("calls toast.error with message", () => {
    appToast.error("Something went wrong!");

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError).toHaveBeenCalledWith("Something went wrong!");
  });

  test("returns result from toast.error", () => {
    mockError.mockReturnValue("error-toast-id");

    const result = appToast.error("Error message");

    expect(result).toBe("error-toast-id");
  });

  test("handles error messages with special characters", () => {
    const errorMessage = "Error: <script>alert('xss')</script>";
    appToast.error(errorMessage);

    expect(mockError).toHaveBeenCalledWith(errorMessage);
  });
});

describe("appToast.info", () => {
  test("calls toast with message", () => {
    appToast.info("Information message");

    expect(mockToast).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith("Information message");
  });

  test("returns result from toast", () => {
    mockToast.mockReturnValue("info-toast-id");

    const result = appToast.info("Info");

    expect(result).toBe("info-toast-id");
  });

  test("handles info messages with unicode", () => {
    const unicodeMessage = "Info: 🎉 日本語 émojis";
    appToast.info(unicodeMessage);

    expect(mockToast).toHaveBeenCalledWith(unicodeMessage);
  });
});

describe("appToast.loading", () => {
  test("calls toast.loading with message", () => {
    appToast.loading("Loading...");

    expect(mockLoading).toHaveBeenCalledTimes(1);
    expect(mockLoading).toHaveBeenCalledWith("Loading...");
  });

  test("returns result from toast.loading", () => {
    mockLoading.mockReturnValue("loading-toast-id");

    const result = appToast.loading("Please wait");

    expect(result).toBe("loading-toast-id");
  });

  test("handles empty loading message", () => {
    appToast.loading("");

    expect(mockLoading).toHaveBeenCalledWith("");
  });
});

describe("appToast.dismiss", () => {
  test("dismisses all toasts when called without id", () => {
    appToast.dismiss();

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledWith(undefined);
  });

  test("dismisses specific toast when called with id", () => {
    appToast.dismiss("toast-id-123");

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledWith("toast-id-123");
  });

  test("handles multiple dismiss calls", () => {
    appToast.dismiss("toast-1");
    appToast.dismiss("toast-2");
    appToast.dismiss();

    expect(mockDismiss).toHaveBeenCalledTimes(3);
  });
});

describe("appToast integration", () => {
  test("can chain different toast types", () => {
    const loadingId = appToast.loading("Saving...");
    appToast.dismiss(loadingId as string);
    appToast.success("Saved!");

    expect(mockLoading).toHaveBeenCalledWith("Saving...");
    expect(mockDismiss).toHaveBeenCalledWith(loadingId);
    expect(mockSuccess).toHaveBeenCalledWith("Saved!");
  });

  test("can show multiple toasts simultaneously", () => {
    appToast.success("First success");
    appToast.success("Second success");
    appToast.error("An error");
    appToast.info("Some info");

    expect(mockSuccess).toHaveBeenCalledTimes(2);
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledTimes(1);
  });
});
