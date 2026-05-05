import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AlertsEmptyState } from "../../alerts/AlertsEmptyState";

jest.mock("~/components/common/ui", () => ({
  EmptyState: ({ icon, title, subtitle, iconOpacity }: { 
    icon: string; 
    title: string; 
    subtitle: string; 
    iconOpacity: number;
  }) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text testID="empty-state-icon">{icon}</Text>
        <Text testID="empty-state-title">{title}</Text>
        <Text testID="empty-state-subtitle">{subtitle}</Text>
        <Text testID="empty-state-opacity">{iconOpacity}</Text>
      </>
    );
  },
}));

describe("AlertsEmptyState", () => {
  it("should render with title and message", () => {
    const { getByTestId } = renderWithProviders(
      <AlertsEmptyState title="No Alerts" message="You have no notifications" />
    );

    expect(getByTestId("empty-state-title").props.children).toBe("No Alerts");
    expect(getByTestId("empty-state-subtitle").props.children).toBe("You have no notifications");
  });

  it("should use alert-circle icon", () => {
    const { getByTestId } = renderWithProviders(
      <AlertsEmptyState title="Test" message="Test message" />
    );

    expect(getByTestId("empty-state-icon").props.children).toBe("alert-circle");
  });

  it("should set icon opacity to 0.5", () => {
    const { getByTestId } = renderWithProviders(
      <AlertsEmptyState title="Test" message="Test message" />
    );

    expect(getByTestId("empty-state-opacity").props.children).toBe(0.5);
  });

  it("should render with different title and message combinations", () => {
    const { getByTestId, rerender } = renderWithProviders(
      <AlertsEmptyState title="Empty Inbox" message="Your inbox is empty" />
    );

    expect(getByTestId("empty-state-title").props.children).toBe("Empty Inbox");
    expect(getByTestId("empty-state-subtitle").props.children).toBe("Your inbox is empty");

    rerender(
      <AlertsEmptyState title="All Read" message="You've read all notifications" />
    );

    expect(getByTestId("empty-state-title").props.children).toBe("All Read");
    expect(getByTestId("empty-state-subtitle").props.children).toBe("You've read all notifications");
  });
});
