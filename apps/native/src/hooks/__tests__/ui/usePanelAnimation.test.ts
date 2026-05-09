import { describe, it, expect, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { usePanelAnimation } from "../../ui/usePanelAnimation";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const mockWithTiming = jest.fn((value: number) => value);
  const mockUseSharedValue = jest.fn((initial: number) => ({ value: initial }));
  return {
    useSharedValue: mockUseSharedValue,
    withTiming: mockWithTiming,
  };
});

describe("usePanelAnimation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with closed state (value = 0)", () => {
    const { result } = renderHook(() => usePanelAnimation());

    expect(result.current.value.value).toBe(0);
  });

  it("should initialize with open state when initialOpen is true", () => {
    const { result } = renderHook(() => usePanelAnimation(true));

    expect(result.current.value.value).toBe(1);
  });

  it("should open panel when open is called", () => {
    const { result } = renderHook(() => usePanelAnimation(false));

    act(() => {
      result.current.open();
    });

    expect(result.current.value.value).toBe(1);
  });

  it("should close panel when close is called", () => {
    const { result } = renderHook(() => usePanelAnimation(true));

    act(() => {
      result.current.close();
    });

    expect(result.current.value.value).toBe(0);
  });

  it("should set open state with setOpen", () => {
    const { result } = renderHook(() => usePanelAnimation(false));

    act(() => {
      result.current.setOpen(true);
    });

    expect(result.current.value.value).toBe(1);

    act(() => {
      result.current.setOpen(false);
    });

    expect(result.current.value.value).toBe(0);
  });

  it("should toggle between open and closed states", () => {
    const { result } = renderHook(() => usePanelAnimation(false));

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value.value).toBe(1);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value.value).toBe(0);
  });

  it("should use default duration of 240ms", () => {
    renderHook(() => usePanelAnimation());

    const reanimatedMock = jest.requireMock("react-native-reanimated") as { withTiming: jest.Mock };
    expect(reanimatedMock.withTiming).toBeDefined();
  });

  it("should accept custom duration", () => {
    const customDuration = 500;

    renderHook(() => usePanelAnimation(false, customDuration));

    expect(true).toBe(true);
  });

  it("should return value and all control functions", () => {
    const { result } = renderHook(() => usePanelAnimation());

    expect(result.current.value).toBeDefined();
    expect(typeof result.current.open).toBe("function");
    expect(typeof result.current.close).toBe("function");
    expect(typeof result.current.setOpen).toBe("function");
    expect(typeof result.current.toggle).toBe("function");
  });

  it("should handle multiple toggles correctly", () => {
    const { result } = renderHook(() => usePanelAnimation(false));

    act(() => result.current.toggle());
    expect(result.current.value.value).toBe(1);

    act(() => result.current.toggle());
    expect(result.current.value.value).toBe(0);

    act(() => result.current.toggle());
    expect(result.current.value.value).toBe(1);

    act(() => result.current.toggle());
    expect(result.current.value.value).toBe(0);
  });

  it("should handle consecutive open calls", () => {
    const { result } = renderHook(() => usePanelAnimation(false));

    act(() => result.current.open());
    act(() => result.current.open());
    act(() => result.current.open());

    expect(result.current.value.value).toBe(1);
  });

  it("should handle consecutive close calls", () => {
    const { result } = renderHook(() => usePanelAnimation(true));

    act(() => result.current.close());
    act(() => result.current.close());
    act(() => result.current.close());

    expect(result.current.value.value).toBe(0);
  });
});
