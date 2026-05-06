import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { NotificationCard } from "../../alerts/NotificationCard";
import type { NotificationItem } from "~/types/notifications";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: function MockIonicons({ name, size, color }: { name: string; size?: number; color?: string }) {
      return React.createElement(View, {
        testID: `icon-${name}`,
        style: { width: size, height: size, color },
      });
    },
  };
});

const mockNotification: NotificationItem = {
  id: "1",
  title: "Test Notification",
  body: "This is a test notification body",
  createdAt: new Date("2024-01-15T10:30:00"),
  updatedAt: new Date("2024-01-15T10:30:00"),
  tripId: "trip-1",
  url: "https://example.com",
  createdById: "user-1",
  createdBy: {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
  },
};

const mockNotificationWithoutAuthor: NotificationItem = {
  id: "2",
  title: "System Alert",
  body: "System maintenance scheduled",
  createdAt: new Date("2024-01-15T12:00:00"),
  updatedAt: new Date("2024-01-15T12:00:00"),
  tripId: null,
  url: "",
  createdById: "system",
  createdBy: null,
};

describe("NotificationCard", () => {
  it("should render notification title", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />
    );

    expect(getByText("Test Notification")).toBeTruthy();
  });

  it("should render notification body", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />
    );

    expect(getByText("This is a test notification body")).toBeTruthy();
  });

  it("should render author name when createdBy is provided", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />
    );

    expect(getByText(/From: John Doe/)).toBeTruthy();
  });

  it("should not render author when createdBy is null", () => {
    const { queryByText } = renderWithProviders(
      <NotificationCard notification={mockNotificationWithoutAuthor} timeLabel="1 hour ago" />
    );

    expect(queryByText(/From:/)).toBeNull();
  });

  it("should render time label", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="Just now" />
    );

    expect(getByText("Just now")).toBeTruthy();
  });

  it("should render different time labels", () => {
    const { getByText, rerender } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="5 minutes ago" />
    );

    expect(getByText("5 minutes ago")).toBeTruthy();

    rerender(
      <NotificationCard notification={mockNotification} timeLabel="Yesterday" />
    );

    expect(getByText("Yesterday")).toBeTruthy();
  });

  it("should render notification icon", () => {
    const { getByTestId } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />
    );

    expect(getByTestId("icon-notifications")).toBeTruthy();
  });

  it("should handle author with partial name (only firstName)", () => {
    const notificationWithPartialName: NotificationItem = {
      ...mockNotification,
      createdBy: {
        id: "user-2",
        firstName: "Jane",
        lastName: null,
      },
    };

    const { getByText } = renderWithProviders(
      <NotificationCard notification={notificationWithPartialName} timeLabel="3 hours ago" />
    );

    expect(getByText(/From: Jane/)).toBeTruthy();
  });

  it("should handle author with partial name (only lastName)", () => {
    const notificationWithPartialName: NotificationItem = {
      ...mockNotification,
      createdBy: {
        id: "user-3",
        firstName: null,
        lastName: "Smith",
      },
    };

    const { getByText } = renderWithProviders(
      <NotificationCard notification={notificationWithPartialName} timeLabel="4 hours ago" />
    );

    expect(getByText(/From:.*Smith/)).toBeTruthy();
  });

  it("should render long notification content", () => {
    const longNotification: NotificationItem = {
      ...mockNotification,
      title: "This is a very long notification title that might wrap to multiple lines",
      body: "This is a very long notification body that contains a lot of information about the notification and might also wrap to multiple lines in the UI",
    };

    const { getByText } = renderWithProviders(
      <NotificationCard notification={longNotification} timeLabel="Today" />
    );

    expect(getByText(longNotification.title)).toBeTruthy();
    expect(getByText(longNotification.body)).toBeTruthy();
  });
});
