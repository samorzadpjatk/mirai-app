import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { NotificationCard } from "../../admin/notifications/NotificationCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

describe("NotificationCard", () => {
  const mockNotification = {
    id: "notif-1",
    title: "Test Notification",
    body: "This is a test notification body",
    createdBy: {
      id: "user-1",
      firstName: "John",
      lastName: "Doe",
    },
    pushes: [
      { targetUserId: "user-1", status: "sent" as const },
      { targetUserId: "user-2", status: "sent" as const },
      { targetUserId: "user-3", status: "failed" as const },
      { targetUserId: "user-4", status: "pending" as const },
    ],
    createdAt: new Date(),
    url: "https://example.com",
  };

  const mockOnRetry = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders notification summary and actions", () => {
    const { getByText, getAllByText } = renderWithProviders(
      <NotificationCard
        notification={mockNotification}
        onRetry={mockOnRetry}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText("Test Notification")).toBeTruthy();
    expect(getByText("This is a test notification body")).toBeTruthy();
    expect(getByText("By John Doe")).toBeTruthy();
    expect(getByText("Sent")).toBeTruthy();
    expect(getAllByText("Failed")).toHaveLength(2);
    expect(getByText("Pending")).toBeTruthy();
    expect(getByText("Total")).toBeTruthy();
    expect(getAllByText("2")).toHaveLength(1);
    expect(getAllByText("1")).toHaveLength(2);
    expect(getByText("4")).toBeTruthy();
  });

  it("calls retry and delete handlers", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard
        notification={mockNotification}
        onRetry={mockOnRetry}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.press(getByText("Retry"));
    fireEvent.press(getByText("Delete"));

    expect(mockOnRetry).toHaveBeenCalledWith("notif-1");
    expect(mockOnDelete).toHaveBeenCalledWith("notif-1");
  });

  it("does not retry when there are no failed pushes", () => {
    const notificationWithNoFailures = {
      ...mockNotification,
      pushes: [
        { targetUserId: "user-1", status: "sent" as const },
        { targetUserId: "user-2", status: "sent" as const },
      ],
    };

    const { getByText } = renderWithProviders(
      <NotificationCard
        notification={notificationWithNoFailures}
        onRetry={mockOnRetry}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText("Retry").parent?.parent?.props.disabled).toBe(true);
  });

  it("shows loading states", () => {
    const { getByText } = renderWithProviders(
      <NotificationCard
        notification={mockNotification}
        onRetry={mockOnRetry}
        onDelete={mockOnDelete}
        isRetrying
        isDeleting
      />
    );

    expect(getByText("Retrying...")).toBeTruthy();
    expect(getByText("Deleting...")).toBeTruthy();
  });

  it("falls back to unknown user when creator name is missing", () => {
    const notificationWithoutCreatorName = {
      ...mockNotification,
      createdBy: { id: "user-1" },
    };

    const { getByText } = renderWithProviders(
      <NotificationCard
        notification={notificationWithoutCreatorName}
        onRetry={mockOnRetry}
        onDelete={mockOnDelete}
      />
    );

    expect(getByText("By Unknown User")).toBeTruthy();
  });
});
