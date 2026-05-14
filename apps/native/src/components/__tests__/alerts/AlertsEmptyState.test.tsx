import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AlertsEmptyState } from "../../alerts/AlertsEmptyState";

jest.mock("~/components/common/ui", () => {
  const { Text } = require("react-native");
  return {
    EmptyState: ({
      icon,
      title,
      subtitle,
      iconOpacity,
    }: {
      icon: string;
      title: string;
      subtitle: string;
      iconOpacity: number;
    }) => {
      return (
        <>
          <Text testID="empty-state-icon">{icon}</Text>
          <Text testID="empty-state-title">{title}</Text>
          <Text testID="empty-state-subtitle">{subtitle}</Text>
          <Text testID="empty-state-opacity">{iconOpacity}</Text>
        </>
      );
    },
  };
});

describe("AlertsEmptyState", () => {
  it("should render with title and message", () => {
    renderWithProviders(<AlertsEmptyState title="No Alerts" message="You have no notifications" />);

    expect(screen.getByTestId("empty-state-title").props.children).toBe("No Alerts");
    expect(screen.getByTestId("empty-state-subtitle").props.children).toBe(
      "You have no notifications",
    );
  });

  it("should use alert-circle icon", () => {
    renderWithProviders(<AlertsEmptyState title="Test" message="Test message" />);

    expect(screen.getByTestId("empty-state-icon").props.children).toBe("alert-circle");
  });

  it("should set icon opacity to 0.5", () => {
    renderWithProviders(<AlertsEmptyState title="Test" message="Test message" />);

    expect(screen.getByTestId("empty-state-opacity").props.children).toBe(0.5);
  });

  it("should render with different title and message combinations", () => {
    const { rerender } = renderWithProviders(
      <AlertsEmptyState title="Empty Inbox" message="Your inbox is empty" />,
    );

    expect(screen.getByTestId("empty-state-title").props.children).toBe("Empty Inbox");
    expect(screen.getByTestId("empty-state-subtitle").props.children).toBe("Your inbox is empty");

    rerender(<AlertsEmptyState title="All Read" message="You've read all notifications" />);

    expect(screen.getByTestId("empty-state-title").props.children).toBe("All Read");
    expect(screen.getByTestId("empty-state-subtitle").props.children).toBe(
      "You've read all notifications",
    );
  });
});
