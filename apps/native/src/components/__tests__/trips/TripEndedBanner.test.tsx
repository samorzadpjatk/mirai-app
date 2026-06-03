import { screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { TripEndedBanner } from "../../trips/TripEndedBanner";
import { renderWithProviders } from "../helpers/renderWithProviders";

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
    renderWithProviders(<TripEndedBanner visible={true} />);

    expect(screen.getByTestId("icon-information-circle-outline")).toBeOnTheScreen();
    expect(screen.getByText("This trip has ended — view only")).toBeOnTheScreen();
  });

  it("returns null when visible=false", () => {
    renderWithProviders(<TripEndedBanner visible={false} />);

    expect(screen.queryByText("This trip has ended — view only")).toBeNull();
    expect(screen.queryByTestId("icon-information-circle-outline")).toBeNull();
  });

  it("renders by default when visible prop is not provided", () => {
    renderWithProviders(<TripEndedBanner />);

    expect(screen.getByText("This trip has ended — view only")).toBeOnTheScreen();
    expect(screen.getByTestId("icon-information-circle-outline")).toBeOnTheScreen();
  });

  it("has correct styling", () => {
    renderWithProviders(<TripEndedBanner visible={true} />);

    expect(screen.getByText("This trip has ended — view only")).toBeOnTheScreen();
    expect(screen.getByTestId("icon-information-circle-outline")).toBeOnTheScreen();
  });
});
