import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { screen } from "@testing-library/react-native";
import { NotificationCard } from "../../alerts/NotificationCard";
import type { NotificationItem } from "~/types/notifications";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: function MockIonicons({
      name,
      size,
      color,
    }: {
      name: string;
      size?: number;
      color?: string;
    }) {
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
    renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />,
    );

    expect(screen.getByText("Test Notification")).toBeOnTheScreen();
  });

  it("should render notification body", () => {
    renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />,
    );

    expect(screen.getByText("This is a test notification body")).toBeOnTheScreen();
  });

  it("should render author name when createdBy is provided", () => {
    renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />,
    );

    expect(screen.getByText(/From: John Doe/)).toBeOnTheScreen();
  });

  it("should not render author when createdBy is null", () => {
    renderWithProviders(
      <NotificationCard notification={mockNotificationWithoutAuthor} timeLabel="1 hour ago" />,
    );

    expect(screen.queryByText(/From:/)).toBeNull();
  });

  it("should render time label", () => {
    renderWithProviders(<NotificationCard notification={mockNotification} timeLabel="Just now" />);

    expect(screen.getByText("Just now")).toBeOnTheScreen();
  });

  it("should render different time labels", () => {
    const { rerender } = renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="5 minutes ago" />,
    );

    expect(screen.getByText("5 minutes ago")).toBeOnTheScreen();

    rerender(<NotificationCard notification={mockNotification} timeLabel="Yesterday" />);

    expect(screen.getByText("Yesterday")).toBeOnTheScreen();
  });

  it("should render notification icon", () => {
    renderWithProviders(
      <NotificationCard notification={mockNotification} timeLabel="2 hours ago" />,
    );

    expect(screen.getByTestId("icon-notifications")).toBeOnTheScreen();
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

    renderWithProviders(
      <NotificationCard notification={notificationWithPartialName} timeLabel="3 hours ago" />,
    );

    expect(screen.getByText(/From: Jane/)).toBeOnTheScreen();
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

    renderWithProviders(
      <NotificationCard notification={notificationWithPartialName} timeLabel="4 hours ago" />,
    );

    expect(screen.getByText(/From:.*Smith/)).toBeOnTheScreen();
  });

  it("should render long notification content", () => {
    const longNotification: NotificationItem = {
      ...mockNotification,
      title: "This is a very long notification title that might wrap to multiple lines",
      body: "This is a very long notification body that contains a lot of information about the notification and might also wrap to multiple lines in the UI",
    };

    renderWithProviders(<NotificationCard notification={longNotification} timeLabel="Today" />);

    expect(screen.getByText(longNotification.title)).toBeOnTheScreen();
    expect(screen.getByText(longNotification.body)).toBeOnTheScreen();
  });
});
