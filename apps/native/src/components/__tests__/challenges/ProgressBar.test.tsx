import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ProgressBar } from "../../challenges/ProgressBar";

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    useSharedValue: jest.fn().mockReturnValue({ value: 0 }),
    useAnimatedStyle: jest.fn().mockReturnValue({ width: "50%" }),
    withTiming: jest.fn().mockReturnValue(50),
    interpolate: jest.fn().mockReturnValue(50),
    default: {
      View: (props: any) => React.createElement(RN.View, { testID: "progress-fill", ...props }),
    },
    View: (props: any) => React.createElement(RN.View, { testID: "progress-fill", ...props }),
  };
});

describe("ProgressBar", () => {
  it("renders the progress fill", () => {
    const { getByTestId } = renderWithProviders(<ProgressBar progress={50} />);
    expect(getByTestId("progress-fill")).toBeTruthy();
  });
});
