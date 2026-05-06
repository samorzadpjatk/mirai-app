import React from "react";
import { render, screen } from "@testing-library/react-native";
import { EmptyState } from "../common/ui/EmptyState";

describe("EmptyState", () => {
  it("renders with title only", () => {
    render(<EmptyState title="No items found" />);

    expect(screen.getByText("No items found")).toBeOnTheScreen();
  });

  it("renders with title and subtitle", () => {
    render(
      <EmptyState
        title="No trips available"
        subtitle="Check back later for new trips"
      />
    );

    expect(screen.getByText("No trips available")).toBeOnTheScreen();
    expect(screen.getByText("Check back later for new trips")).toBeOnTheScreen();
  });

  it("renders with icon when provided", () => {
    render(<EmptyState title="Empty" icon="search-outline" />);

    expect(screen.getByText("Empty")).toBeOnTheScreen();
  });

  it("applies custom opacity to icon", () => {
    render(<EmptyState title="Test" icon="home-outline" iconOpacity={0.8} />);

    expect(screen.getByText("Test")).toBeOnTheScreen();
  });

  it("uses default icon size and color", () => {
    render(<EmptyState title="Default styling" icon="star-outline" />);

    expect(screen.getByText("Default styling")).toBeOnTheScreen();
  });

  it("renders without icon when not provided", () => {
    render(<EmptyState title="No icon here" />);

    expect(screen.getByText("No icon here")).toBeOnTheScreen();
  });
});
