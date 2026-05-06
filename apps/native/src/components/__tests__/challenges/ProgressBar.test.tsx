import React from "react";
import { View } from "react-native";
import type { ViewProps } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ProgressBar } from "../../challenges/ProgressBar";

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
      View: (props: AnimatedViewProps) => React.createElement(View, { testID: "progress-fill", ...props }),
    },
    View: (props: AnimatedViewProps) => React.createElement(View, { testID: "progress-fill", ...props }),
  };
});

describe("ProgressBar", () => {
  it("renders the progress fill", () => {
    const { getByTestId } = renderWithProviders(<ProgressBar progress={50} />);
    expect(getByTestId("progress-fill")).toBeTruthy();
  });
});
