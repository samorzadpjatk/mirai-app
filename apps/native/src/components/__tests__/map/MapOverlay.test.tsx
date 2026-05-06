import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapOverlay } from "../../map/overlays/MapOverlay";

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: function MockLinearGradient({ children }: { children: React.ReactNode; colors: string[] }) {
    return <View testID="linear-gradient">{children}</View>;
  },
}));

describe("MapOverlay", () => {
  const defaultProps = {
    activeCount: 5,
    fadedCount: 2,
  };

  it("renders title and subtitle", () => {
    const { getByText } = renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(getByText("Live map")).toBeTruthy();
    expect(getByText("Tap avatar to inspect user")).toBeTruthy();
  });

  it("renders the counts and labels", () => {
    const { getByText } = renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(getByText("5")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("Faded")).toBeTruthy();
  });

  it("renders the recenter action when provided", () => {
    const mockOnRecenter = jest.fn();
    const { getByText } = renderWithProviders(
      <MapOverlay {...defaultProps} onRecenter={mockOnRecenter} />
    );

    fireEvent.press(getByText("Center"));
    expect(mockOnRecenter).toHaveBeenCalled();
  });

  it("does not render recenter action by default", () => {
    const { queryByText } = renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(queryByText("Center")).toBeNull();
  });

  it("supports custom title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <MapOverlay {...defaultProps} title="Custom Title" subtitle="Custom subtitle" />
    );

    expect(getByText("Custom Title")).toBeTruthy();
    expect(getByText("Custom subtitle")).toBeTruthy();
  });

  it("renders zero counts twice", () => {
    const { getAllByText } = renderWithProviders(<MapOverlay activeCount={0} fadedCount={0} />);

    expect(getAllByText("0")).toHaveLength(2);
  });

  it("renders the gradient background", () => {
    const { getByTestId } = renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(getByTestId("linear-gradient")).toBeTruthy();
  });

  it("handles large counts", () => {
    const { getByText } = renderWithProviders(<MapOverlay activeCount={999} fadedCount={1000} />);

    expect(getByText("999")).toBeTruthy();
    expect(getByText("1000")).toBeTruthy();
  });
});
