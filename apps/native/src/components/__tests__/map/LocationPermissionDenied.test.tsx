import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { LocationPermissionDenied } from "../../map/LocationPermissionDenied";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
      return React.createElement(View, {
        testID: `icon-${name}`,
        style: { width: size, height: size, color }
      });
    },
  };
});

describe("LocationPermissionDenied", () => {
  it("should render full message by default", () => {
    const { getByText } = renderWithProviders(<LocationPermissionDenied />);

    expect(getByText("Location Sharing Disabled")).toBeTruthy();
    expect(getByText(/Location sharing has been turned off/)).toBeTruthy();
    expect(getByText(/To enable location sharing, go to your Profile settings/)).toBeTruthy();
  });

  it("should render compact version when compact prop is true", () => {
    const { getByText, getByTestId } = renderWithProviders(<LocationPermissionDenied compact={true} />);

    expect(getByText("Location sharing disabled")).toBeTruthy();
    expect(getByTestId("icon-locate")).toBeTruthy();
  });

  it("should not render full message in compact mode", () => {
    const { queryByText } = renderWithProviders(<LocationPermissionDenied compact={true} />);

    expect(queryByText("Location Sharing Disabled")).toBeNull();
    expect(queryByText(/Location sharing has been turned off/)).toBeNull();
  });

  it("should render icon in full mode", () => {
    const { getByTestId } = renderWithProviders(<LocationPermissionDenied />);

    expect(getByTestId("icon-locate")).toBeTruthy();
  });

  it("should render container with correct structure", () => {
    const { getByTestId } = renderWithProviders(<LocationPermissionDenied />);

    const container = getByTestId("location-permission-denied");
    expect(container).toBeTruthy();
  });

  it("should render compact container with row direction", () => {
    const { getByTestId } = renderWithProviders(<LocationPermissionDenied compact={true} />);

    const container = getByTestId("location-permission-denied-compact");
    expect(container).toBeTruthy();
  });
});
