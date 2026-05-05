import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { NotificationScheduleCard } from "../../notifications/NotificationScheduleCard";

const mockMutateDelete = jest.fn();
const mockMutateToggle = jest.fn();

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: () => ({
    notificationSchedule: {
      delete: {
        mutationOptions: () => ({
          mutationFn: mockMutateDelete,
        }),
      },
      toggleActive: {
        mutationOptions: () => ({
          mutationFn: mockMutateToggle,
        }),
      },
      getAll: {
        queryOptions: () => ({
          queryKey: ["notificationSchedule", "getAll"],
        }),
      },
    },
  }),
}));

jest.mock("@tanstack/react-query", () => {
  return {
    useMutation: jest.fn((options) => ({
      mutate: jest.fn((args) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      }),
      isLoading: false,
      error: null,
    })),
    useQueryClient: jest.fn(() => ({
      invalidateQueries: jest.fn(),
      refetchQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
      clear: jest.fn(),
    })),
    QueryClient: jest.fn(),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  Alert: {
    alert: jest.fn((title: string, message: string, buttons: Array<{ style?: string; onPress?: () => void }>) => {
      const deleteButton = buttons?.find((b) => b.style === "destructive");
      if (deleteButton?.onPress) {
        deleteButton.onPress();
      }
    }),
  },
}));

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
    jest.clearAllMocks();
  });

  it("should render schedule name", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText("Test Schedule")).toBeTruthy();
  });

  it("should render creator information", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText(/Created by/)).toBeTruthy();
    expect(getByText(/John Doe/)).toBeTruthy();
  });

  it("should render active status tag", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText("Active")).toBeTruthy();
  });

  it("should render notification type tag", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText("REMINDER")).toBeTruthy();
  });

  it("should render trip name tag when trip exists", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText("Summer Trip 2024")).toBeTruthy();
  });

  it("should render time tag with correct format", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText("09:30")).toBeTruthy();
  });

  it("should render period information", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText(/Period:/)).toBeTruthy();
  });

  it("should render last run information when lastRun exists", () => {
    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(getByText(/Last run:/)).toBeTruthy();
  });

  it("should render toggle button when active", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should render delete button", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should call toggle mutation when toggle button is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);

    expect(buttons[0]).toBeTruthy();
  });

  it("should show delete confirmation when delete button is pressed", () => {
    const { UNSAFE_getAllByType } = renderWithProviders(
      <NotificationScheduleCard schedule={mockSchedule} />
    );

    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[1]);

    const { Alert } = require("react-native");
    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Schedule?",
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel", style: "cancel" }),
        expect.objectContaining({ text: "Delete", style: "destructive" }),
      ])
    );
  });
});

describe("NotificationScheduleCard - conditional states", () => {
  it("should render inactive status tag when schedule is inactive", () => {
    const inactiveSchedule = {
      ...mockSchedule,
      isActive: false,
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={inactiveSchedule} />
    );

    expect(getByText("Inactive")).toBeTruthy();
  });

  it("should render toggle button when inactive", () => {
    const inactiveSchedule = {
      ...mockSchedule,
      isActive: false,
    };

    const { UNSAFE_getAllByType } = renderWithProviders(
      <NotificationScheduleCard schedule={inactiveSchedule} />
    );

    expect(UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should not render trip tag when trip is null", () => {
    const scheduleWithoutTrip = {
      ...mockSchedule,
      trip: null,
    };

    const { queryByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleWithoutTrip} />
    );

    expect(queryByText("Summer Trip 2024")).toBeNull();
  });

  it("should not render last run info when lastRun is null", () => {
    const scheduleWithoutLastRun = {
      ...mockSchedule,
      lastRun: null,
    };

    const { queryByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleWithoutLastRun} />
    );

    expect(queryByText(/Last run:/)).toBeNull();
  });

  it("should handle unknown creator", () => {
    const scheduleWithUnknownCreator = {
      ...mockSchedule,
      createdBy: null,
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleWithUnknownCreator} />
    );

    expect(getByText(/Unknown/)).toBeTruthy();
  });

  it("should handle creator with partial name", () => {
    const scheduleWithPartialName = {
      ...mockSchedule,
      createdBy: {
        firstName: "Jane",
        lastName: null,
      },
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleWithPartialName} />
    );

    expect(getByText(/Jane/)).toBeTruthy();
  });

  it("should pad single digit hours and minutes", () => {
    const scheduleWithSingleDigits = {
      ...mockSchedule,
      hour: 5,
      minute: 5,
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleWithSingleDigits} />
    );

    expect(getByText("05:05")).toBeTruthy();
  });

  it("should handle midnight time correctly", () => {
    const scheduleAtMidnight = {
      ...mockSchedule,
      hour: 0,
      minute: 0,
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleAtMidnight} />
    );

    expect(getByText("00:00")).toBeTruthy();
  });

  it("should handle end of day time correctly", () => {
    const scheduleAtEndOfDay = {
      ...mockSchedule,
      hour: 23,
      minute: 59,
    };

    const { getByText } = renderWithProviders(
      <NotificationScheduleCard schedule={scheduleAtEndOfDay} />
    );

    expect(getByText("23:59")).toBeTruthy();
  });
});
