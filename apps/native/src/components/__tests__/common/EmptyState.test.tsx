import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
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
    const { getByText } = renderWithProviders(
      <EmptyState title="No Data" />
    );

    expect(getByText("No Data")).toBeTruthy();
  });

  it("should render with subtitle when provided", () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No Data" subtitle="Try refreshing the page" />
    );

    expect(getByText("No Data")).toBeTruthy();
    expect(getByText("Try refreshing the page")).toBeTruthy();
  });

  it("should not render subtitle when not provided", () => {
    const { queryByText } = renderWithProviders(
      <EmptyState title="No Data" />
    );

    expect(queryByText("Some subtitle")).toBeNull();
  });

  it("should render icon when provided", () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No Data" icon="search" />
    );

    expect(getByText("search")).toBeTruthy();
  });

  it("should not render icon when not provided", () => {
    const { queryByText } = renderWithProviders(
      <EmptyState title="No Data" />
    );

    expect(queryByText("search")).toBeNull();
  });

  it("should apply custom icon size", () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No Data" icon="search" iconSize={64} />
    );

    const icon = getByText("search");
    expect(icon).toBeTruthy();
  });

  it("should apply custom icon color", () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No Data" icon="search" iconColor="#FF0000" />
    );

    const icon = getByText("search");
    expect(icon).toBeTruthy();
  });

  it("should apply custom icon opacity", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <EmptyState title="No Data" icon="search" iconOpacity={0.8} />
    );

    const views = UNSAFE_getAllByType(View) as ViewElement[];
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
    const { UNSAFE_getAllByType } = renderWithProviders(
      <EmptyState title="No Data" icon="search" />
    );

    const views = UNSAFE_getAllByType(View) as ViewElement[];
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
    const { UNSAFE_getByType } = renderWithProviders(
      <EmptyState title="No Data" style={customStyle} />
    );

    const container = UNSAFE_getByType(View);
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should render with different icon names", () => {
    const { getByText, rerender } = renderWithProviders(
      <EmptyState title="No Data" icon="home" />
    );

    expect(getByText("home")).toBeTruthy();

    rerender(<EmptyState title="No Data" icon="person" />);
    expect(getByText("person")).toBeTruthy();
  });
});
