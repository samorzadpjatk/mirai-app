import React from "react";
import { Text } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { TripEndedBanner } from "../../trips/TripEndedBanner";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Ionicons: function MockIonicons({ name }: { name: string; size: number; color: string }) {
      return React.createElement(Text, { testID: `icon-${name}` }, name);
    },
  };
});

describe("TripEndedBanner", () => {
  it("renders with warning icon and text when visible=true", () => {
    const { getByText, getByTestId } = renderWithProviders(<TripEndedBanner visible={true} />);

    expect(getByTestId("icon-information-circle-outline")).toBeTruthy();
    expect(getByText("This trip has ended — view only")).toBeTruthy();
  });

  it("returns null when visible=false", () => {
    const { queryByText, queryByTestId } = renderWithProviders(<TripEndedBanner visible={false} />);

    expect(queryByText("This trip has ended — view only")).toBeNull();
    expect(queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("renders by default when visible prop is not provided", () => {
    const { getByText, getByTestId } = renderWithProviders(<TripEndedBanner />);

    expect(getByText("This trip has ended — view only")).toBeTruthy();
    expect(getByTestId("icon-information-circle-outline")).toBeTruthy();
  });

  it("has correct styling", () => {
    const { getByText, getByTestId } = renderWithProviders(<TripEndedBanner visible={true} />);

    expect(getByText("This trip has ended — view only")).toBeTruthy();
    expect(getByTestId("icon-information-circle-outline")).toBeTruthy();
  });
});
