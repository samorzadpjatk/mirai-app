import { describe, expect, it, jest } from "@jest/globals";
import { focusManager } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { useAppStateRefresh } from "../../ui/useAppStateRefresh";

type AppStateHandler = (status: AppStateStatus) => void;

/**
 * Capture the listener the hook registers so a test can drive it directly.
 * Returns the remove spy too: a hook that never unsubscribes leaks a listener
 * per screen mount.
 */
function mountWithCapturedListener() {
  let handler: AppStateHandler | undefined;
  const remove = jest.fn();
  const addEventListener = jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      handler = listener as AppStateHandler;
      return { remove } as ReturnType<typeof AppState.addEventListener>;
    });

  const view = renderHook(() => useAppStateRefresh());

  return { view, remove, addEventListener, fire: (status: AppStateStatus) => handler?.(status) };
}

describe("useAppStateRefresh", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    focusManager.setFocused(undefined);
  });

  it("subscribes to AppState changes", () => {
    const { addEventListener } = mountWithCapturedListener();

    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  // The bug this hook exists for: React Query has no native focus signal, so a
  // screen left mounted while the phone was in a pocket kept serving the coin
  // balance it cached before the award.
  it("marks the app focused when it returns to the foreground", () => {
    const { fire } = mountWithCapturedListener();

    fire("background");
    fire("active");

    expect(focusManager.isFocused()).toBe(true);
  });

  it("drops focus when the app goes to the background", () => {
    const { fire } = mountWithCapturedListener();

    fire("active");
    fire("background");

    expect(focusManager.isFocused()).toBe(false);
  });

  it("removes its listener on unmount", () => {
    const { view, remove } = mountWithCapturedListener();

    view.unmount();

    expect(remove).toHaveBeenCalled();
  });
});
