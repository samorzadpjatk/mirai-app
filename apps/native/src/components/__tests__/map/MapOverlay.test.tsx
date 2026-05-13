import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { MapOverlay } from "../../map/overlays/MapOverlay";

jest.mock("expo-linear-gradient", () => {
  const { createElement } = jest.requireActual("react");
  return {
    LinearGradient: function MockLinearGradient({
      children,
    }: {
      children: React.ReactNode;
      colors: string[];
    }) {
      return createElement("View", { testID: "linear-gradient" }, children);
    },
  };
});

describe("MapOverlay", () => {
  const defaultProps = {
    activeCount: 5,
    fadedCount: 2,
  };

  it("renders title and subtitle", () => {
    renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(screen.getByText("Live map")).toBeOnTheScreen();
    expect(screen.getByText("Tap avatar to inspect user")).toBeOnTheScreen();
  });

  it("renders the counts and labels", () => {
    renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(screen.getByText("5")).toBeOnTheScreen();
    expect(screen.getByText("Active")).toBeOnTheScreen();
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(screen.getByText("Faded")).toBeOnTheScreen();
  });

  it("renders the recenter action when provided", () => {
    const mockOnRecenter = jest.fn();
    renderWithProviders(<MapOverlay {...defaultProps} onRecenter={mockOnRecenter} />);

    fireEvent.press(screen.getByText("Center"));
    expect(mockOnRecenter).toHaveBeenCalled();
  });

  it("does not render recenter action by default", () => {
    renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(screen.queryByText("Center")).toBeNull();
  });

  it("supports custom title and subtitle", () => {
    renderWithProviders(
      <MapOverlay {...defaultProps} title="Custom Title" subtitle="Custom subtitle" />,
    );

    expect(screen.getByText("Custom Title")).toBeOnTheScreen();
    expect(screen.getByText("Custom subtitle")).toBeOnTheScreen();
  });

  it("renders zero counts twice", () => {
    const { getAllByText } = renderWithProviders(<MapOverlay activeCount={0} fadedCount={0} />);

    expect(getAllByText("0")).toHaveLength(2);
  });

  it("renders the gradient background", () => {
    renderWithProviders(<MapOverlay {...defaultProps} />);

    expect(screen.getByTestId("linear-gradient")).toBeOnTheScreen();
  });

  it("handles large counts", () => {
    renderWithProviders(<MapOverlay activeCount={999} fadedCount={1000} />);

    expect(screen.getByText("999")).toBeOnTheScreen();
    expect(screen.getByText("1000")).toBeOnTheScreen();
  });
});
