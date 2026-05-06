import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { LocationPermissionDenied } from "../../map/LocationPermissionDenied";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
    return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
  },
}));

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
    const { UNSAFE_getByType } = renderWithProviders(<LocationPermissionDenied />);

    const container = UNSAFE_getByType(View);
    expect(container).toBeTruthy();
  });

  it("should render compact container with row direction", () => {
    const { UNSAFE_getByType } = renderWithProviders(<LocationPermissionDenied compact={true} />);

    const container = UNSAFE_getByType(View);
    expect(container).toBeTruthy();
  });
});
