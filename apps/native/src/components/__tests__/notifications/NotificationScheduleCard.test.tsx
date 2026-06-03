import React from "react";
import { Alert } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";
import { NotificationScheduleCard } from "../../notifications/NotificationScheduleCard";

jest.mock("~/utils/format", () => ({
  formatRelativeTime: () => "2 hours ago",
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

const mockSchedule = {
  id: "schedule-1",
  name: "Test Schedule",
  isActive: true,
  notificationType: "REMINDER",
  hour: 9,
  minute: 30,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  createdAt: new Date().toISOString(),
  lastRun: new Date().toISOString(),
  createdBy: {
    firstName: "John",
    lastName: "Doe",
  },
  trip: {
    name: "Summer Trip 2024",
  },
};

describe("NotificationScheduleCard", () => {
  beforeEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((b) => b.style === "destructive");
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });
  });

  it("should render schedule name", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Test Schedule")).toBeTruthy();
  });

  it("should render creator information", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Created by/)).toBeTruthy();
    expect(screen.getByText(/John Doe/)).toBeTruthy();
  });

  it("should render active status tag", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("should render notification type tag", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("REMINDER")).toBeTruthy();
  });

  it("should render trip name tag when trip exists", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Summer Trip 2024")).toBeTruthy();
  });

  it("should render time tag with correct format", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("09:30")).toBeTruthy();
  });

  it("should render period information", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Period:/)).toBeTruthy();
  });

  it("should render last run information when lastRun exists", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Last run:/)).toBeTruthy();
  });

  it("should render toggle button when active", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByTestId("toggle-button")).toBeTruthy();
  });

  it("should render delete button", () => {
    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByTestId("delete-button")).toBeTruthy();
  });

  it("should call toggle mutation when toggle button is pressed", async () => {
    const toggleResolver = jest.fn(() => ({ ...mockSchedule, isActive: false }));
    server.use(createORPCHandler(["notificationSchedule", "toggleActive"], toggleResolver));

    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    const toggleButton = screen.getByTestId("toggle-button");
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(toggleResolver).toHaveBeenCalledWith({ id: mockSchedule.id });
    });
  });

  it("should show delete confirmation when delete button is pressed", () => {
    server.use(createORPCHandler(["notificationSchedule", "delete"], () => ({ success: true })));

    renderWithMSW(<NotificationScheduleCard schedule={mockSchedule} />);

    const deleteButton = screen.getByTestId("delete-button");
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Schedule?",
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
        expect.objectContaining({ text: "Delete", style: "destructive" }),
      ]),
    );
  });
});

describe("NotificationScheduleCard - conditional states", () => {
  beforeEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const deleteButton = buttons?.find((b) => b.style === "destructive");
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    });
  });

  it("should render inactive status tag when schedule is inactive", () => {
    const inactiveSchedule = {
      ...mockSchedule,
      isActive: false,
    };

    renderWithMSW(<NotificationScheduleCard schedule={inactiveSchedule} />);

    expect(screen.getByText("Inactive")).toBeTruthy();
  });

  it("should render toggle button when inactive", () => {
    const inactiveSchedule = {
      ...mockSchedule,
      isActive: false,
    };

    renderWithMSW(<NotificationScheduleCard schedule={inactiveSchedule} />);

    expect(screen.getByTestId("toggle-button")).toBeTruthy();
  });

  it("should not render trip tag when trip is null", () => {
    const scheduleWithoutTrip = {
      ...mockSchedule,
      trip: null,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleWithoutTrip} />);

    expect(screen.queryByText("Summer Trip 2024")).toBeNull();
  });

  it("should not render last run info when lastRun is null", () => {
    const scheduleWithoutLastRun = {
      ...mockSchedule,
      lastRun: null,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleWithoutLastRun} />);

    expect(screen.queryByText(/Last run:/)).toBeNull();
  });

  it("should handle unknown creator", () => {
    const scheduleWithUnknownCreator = {
      ...mockSchedule,
      createdBy: null,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleWithUnknownCreator} />);

    expect(screen.getByText(/Unknown/)).toBeTruthy();
  });

  it("should handle creator with partial name", () => {
    const scheduleWithPartialName = {
      ...mockSchedule,
      createdBy: {
        firstName: "Jane",
        lastName: null,
      },
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleWithPartialName} />);

    expect(screen.getByText(/Jane/)).toBeTruthy();
  });

  it("should pad single digit hours and minutes", () => {
    const scheduleWithSingleDigits = {
      ...mockSchedule,
      hour: 5,
      minute: 5,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleWithSingleDigits} />);

    expect(screen.getByText("05:05")).toBeTruthy();
  });

  it("should handle midnight time correctly", () => {
    const scheduleAtMidnight = {
      ...mockSchedule,
      hour: 0,
      minute: 0,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleAtMidnight} />);

    expect(screen.getByText("00:00")).toBeTruthy();
  });

  it("should handle end of day time correctly", () => {
    const scheduleAtEndOfDay = {
      ...mockSchedule,
      hour: 23,
      minute: 59,
    };

    renderWithMSW(<NotificationScheduleCard schedule={scheduleAtEndOfDay} />);

    expect(screen.getByText("23:59")).toBeTruthy();
  });
});
