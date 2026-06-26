import { screen } from "@testing-library/react-native";
import React from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";
import { ProgressBar } from "../../challenges/ProgressBar";
import { renderWithProviders } from "../helpers/renderWithProviders";

interface AnimatedViewProps extends ViewProps {
  testID?: string;
}

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    useSharedValue: jest.fn().mockReturnValue({ value: 0 }),
    useAnimatedStyle: jest.fn().mockReturnValue({ width: "50%" }),
    withTiming: jest.fn().mockReturnValue(50),
    interpolate: jest.fn().mockReturnValue(50),
    default: {
      View: (props: AnimatedViewProps) =>
        React.createElement(View, { testID: "progress-fill", ...props }),
    },
    View: (props: AnimatedViewProps) =>
      React.createElement(View, { testID: "progress-fill", ...props }),
  };
});

describe("ProgressBar", () => {
  it("renders the progress fill with correct width style", () => {
    renderWithProviders(<ProgressBar progress={50} />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toBeTruthy();
    expect(progressFill.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ width: "50%" })]),
    );
  });
});
