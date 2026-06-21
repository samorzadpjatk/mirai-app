import { render } from "@testing-library/react-native";
import React from "react";
import { useReducedMotion } from "react-native-reanimated";
import { spacing } from "~/styles";
import { Skeleton } from "../../ui/Skeleton";

describe("Skeleton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useReducedMotion as jest.Mock).mockReturnValue(false);
  });

  it("renders box variant with explicit width and height", () => {
    const { getByTestId } = render(
      <Skeleton variant="box" width={120} height={80} testID="box-skeleton" />,
    );

    expect(getByTestId("box-skeleton")).toBeTruthy();
    expect(getByTestId("box-skeleton")).toHaveStyle({
      width: 120,
      height: 80,
    });
    expect(getByTestId("box-skeleton-gradient")).toBeTruthy();
  });

  it("renders text variant with default text height and rounded corners", () => {
    const { getByTestId } = render(<Skeleton variant="text" width={200} testID="text-skeleton" />);

    expect(getByTestId("text-skeleton")).toBeTruthy();
    expect(getByTestId("text-skeleton")).toHaveStyle({
      height: 14,
      borderRadius: 8,
    });
  });

  it("renders line variant matching text defaults", () => {
    const { getByTestId } = render(<Skeleton variant="line" width={160} testID="line-skeleton" />);

    expect(getByTestId("line-skeleton")).toBeTruthy();
    expect(getByTestId("line-skeleton")).toHaveStyle({
      height: 14,
      borderRadius: 8,
    });
  });

  it("renders circle variant with border radius half the width", () => {
    const { getByTestId } = render(
      <Skeleton variant="circle" width={48} height={48} testID="circle-skeleton" />,
    );

    expect(getByTestId("circle-skeleton")).toBeTruthy();
    expect(getByTestId("circle-skeleton")).toHaveStyle({
      borderRadius: 24,
    });
  });

  it("respects explicit border radius override", () => {
    const { getByTestId } = render(
      <Skeleton variant="box" width={100} height={50} borderRadius={4} testID="radius-skeleton" />,
    );

    expect(getByTestId("radius-skeleton")).toHaveStyle({
      borderRadius: 4,
    });
  });

  it("Skeleton.Line renders repeated rows", () => {
    const { getByTestId, queryByTestId } = render(
      <Skeleton.Line count={2} width={100} testID="multi-line" />,
    );

    expect(getByTestId("multi-line")).toBeTruthy();
    expect(getByTestId("multi-line-0")).toBeTruthy();
    expect(getByTestId("multi-line-1")).toBeTruthy();
    expect(queryByTestId("multi-line-2")).toBeNull();
  });

  it("Skeleton.Group renders child skeletons", () => {
    const { getByTestId } = render(
      <Skeleton.Group testID="group">
        <Skeleton variant="box" width={50} height={50} testID="group-child" />
      </Skeleton.Group>,
    );

    expect(getByTestId("group")).toBeTruthy();
    expect(getByTestId("group-child")).toBeTruthy();
  });

  it("Skeleton.Group applies a default gap between skeletons", () => {
    const { getByTestId } = render(
      <Skeleton.Group testID="group-with-gap">
        <Skeleton variant="box" width={50} height={50} testID="child-1" />
        <Skeleton variant="box" width={50} height={50} testID="child-2" />
      </Skeleton.Group>,
    );

    expect(getByTestId("group-with-gap")).toHaveStyle({ gap: spacing.sm });
  });

  it("falls back to a static block when reduce motion is enabled", () => {
    (useReducedMotion as jest.Mock).mockReturnValue(true);

    const { getByTestId, queryByTestId } = render(
      <Skeleton variant="box" width={100} height={30} testID="reduced" />,
    );

    expect(getByTestId("reduced-static")).toBeTruthy();
    expect(queryByTestId("reduced-shimmer")).toBeNull();
    expect(queryByTestId("reduced-gradient")).toBeNull();
  });
});
