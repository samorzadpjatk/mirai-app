import { describe, it, expect, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useCardAnimations } from "~/components/judgement/hooks/useCardAnimations";

describe("useCardAnimations", () => {
  it("initializes with zero translate values", () => {
    const { result } = renderHook(() => useCardAnimations());

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });

  it("resets card position to zero", () => {
    const { result } = renderHook(() => useCardAnimations());

    result.current.translateX.value = 100;
    result.current.translateY.value = 50;

    result.current.resetCardPosition();

    expect(result.current.translateX.value).toBe(0);
    expect(result.current.translateY.value).toBe(0);
  });

  it("updates pan position with dampened Y", () => {
    const { result } = renderHook(() => useCardAnimations());

    result.current.updatePanPosition(100, 50);

    expect(result.current.translateX.value).toBe(100);
    expect(result.current.translateY.value).toBe(30);
  });

  it("does not animate decision when no current submission", () => {
    const { result } = renderHook(() => useCardAnimations());
    const reviewCurrent = jest.fn();

    result.current.animateDecision(
      "APPROVED",
      400,
      false,
      false,
      reviewCurrent,
    );

    expect(reviewCurrent).not.toHaveBeenCalled();
  });

  it("does not animate decision when reviewing", () => {
    const { result } = renderHook(() => useCardAnimations());
    const reviewCurrent = jest.fn();

    result.current.animateDecision(
      "APPROVED",
      400,
      true,
      true,
      reviewCurrent,
    );

    expect(reviewCurrent).not.toHaveBeenCalled();
  });

  it("does not animate REJECTED without reason", () => {
    const { result } = renderHook(() => useCardAnimations());
    const reviewCurrent = jest.fn();

    result.current.animateDecision(
      "REJECTED",
      400,
      false,
      true,
      reviewCurrent,
      "",
    );

    expect(reviewCurrent).not.toHaveBeenCalled();
  });

  it("does not animate REJECTED with whitespace-only reason", () => {
    const { result } = renderHook(() => useCardAnimations());
    const reviewCurrent = jest.fn();

    result.current.animateDecision(
      "REJECTED",
      400,
      false,
      true,
      reviewCurrent,
      "   ",
    );

    expect(reviewCurrent).not.toHaveBeenCalled();
  });
});
