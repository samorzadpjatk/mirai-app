import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AlertsEmptyState } from "../../alerts/AlertsEmptyState";

describe("AlertsEmptyState", () => {
  it("should render with title and message", () => {
    renderWithProviders(<AlertsEmptyState title="No Alerts" message="You have no notifications" />);

    expect(screen.getByText("No Alerts")).toBeOnTheScreen();
    expect(screen.getByText("You have no notifications")).toBeOnTheScreen();
  });

  it("should use alert-circle icon", () => {
    renderWithProviders(<AlertsEmptyState title="Test" message="Test message" />);

    expect(screen.getByTestId("ionicon").props.children).toBe("alert-circle");
  });

  it("should render icon wrapper", () => {
    renderWithProviders(<AlertsEmptyState title="Test" message="Test message" />);

    expect(screen.getByTestId("empty-state-icon-wrapper")).toBeOnTheScreen();
  });

  it("should render with different title and message combinations", () => {
    const { rerender } = renderWithProviders(
      <AlertsEmptyState title="Empty Inbox" message="Your inbox is empty" />,
    );

    expect(screen.getByText("Empty Inbox")).toBeOnTheScreen();
    expect(screen.getByText("Your inbox is empty")).toBeOnTheScreen();

    rerender(<AlertsEmptyState title="All Read" message="You've read all notifications" />);

    expect(screen.getByText("All Read")).toBeOnTheScreen();
    expect(screen.getByText("You've read all notifications")).toBeOnTheScreen();
  });
});
