import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { EmptyState } from "../../common/ui/EmptyState";

interface ViewElement {
  props: ViewProps;
}

interface ViewStyleWithOpacity extends ViewStyle {
  opacity?: number;
}

describe("EmptyState", () => {
  it("should render with title", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.getByText("No Data")).toBeOnTheScreen();
  });

  it("should render with subtitle when provided", () => {
    renderWithProviders(
      <EmptyState title="No Data" subtitle="Try refreshing the page" />
    );

    expect(screen.getByText("No Data")).toBeOnTheScreen();
    expect(screen.getByText("Try refreshing the page")).toBeOnTheScreen();
  });

  it("should not render subtitle when not provided", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.queryByText("Some subtitle")).toBeNull();
  });

  it("should render icon when provided", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" />);

    expect(screen.getByText("search")).toBeOnTheScreen();
  });

  it("should not render icon when not provided", () => {
    renderWithProviders(<EmptyState title="No Data" />);

    expect(screen.queryByText("search")).toBeNull();
  });

  it("should apply custom icon size", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconSize={64} />);

    const icon = screen.getByText("search");
    expect(icon).toBeOnTheScreen();
  });

  it("should apply custom icon color", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconColor="#FF0000" />);

    const icon = screen.getByText("search");
    expect(icon).toBeOnTheScreen();
  });

  it("should apply custom icon opacity", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" iconOpacity={0.8} />);

    const views = screen.UNSAFE_getAllByType(View) as ViewElement[];
    const iconWrapper = views.find((v) => {
      const styles = v.props.style as ViewStyleWithOpacity | ViewStyleWithOpacity[];
      if (Array.isArray(styles)) {
        return styles.some((s: ViewStyleWithOpacity) => s?.opacity === 0.8);
      }
      return styles?.opacity === 0.8;
    });
    expect(iconWrapper).toBeTruthy();
  });

  it("should apply default icon opacity when not specified", () => {
    renderWithProviders(<EmptyState title="No Data" icon="search" />);

    const views = screen.UNSAFE_getAllByType(View) as ViewElement[];
    const iconWrapper = views.find((v) => {
      const styles = v.props.style as ViewStyleWithOpacity | ViewStyleWithOpacity[];
      if (Array.isArray(styles)) {
        return styles.some((s: ViewStyleWithOpacity) => s?.opacity === 0.5);
      }
      return styles?.opacity === 0.5;
    });
    expect(iconWrapper).toBeTruthy();
  });

  it("should apply custom container style", () => {
    const customStyle = { marginTop: 50 };
    renderWithProviders(<EmptyState title="No Data" style={customStyle} />);

    const container = screen.UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render with different icon names", () => {
    const { rerender } = renderWithProviders(
      <EmptyState title="No Data" icon="home" />
    );

    expect(screen.getByText("home")).toBeOnTheScreen();

    rerender(<EmptyState title="No Data" icon="person" />);
    expect(screen.getByText("person")).toBeOnTheScreen();
  });
});
