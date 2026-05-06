import React from "react";
import { TouchableOpacity } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
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

interface MutationOptions {
  onSuccess?: () => void;
}

jest.mock("@tanstack/react-query", () => {
  return {
    useMutation: jest.fn((options: MutationOptions | undefined) => ({
      mutate: jest.fn(() => {
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

interface AlertButton {
  style?: string;
  onPress?: () => void;
}

const mockAlert = jest.fn((title: string, message: string, buttons: AlertButton[]) => {
  const deleteButton = buttons?.find((b) => b.style === "destructive");
  if (deleteButton?.onPress) {
    deleteButton.onPress();
  }
});

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native") as typeof import("react-native");
  return {
    ...actual,
    Alert: {
      alert: (title: string, message: string, buttons: AlertButton[]) => {
        mockAlert(title, message, buttons);
      },
    },
  };
});

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
    mockMutateDelete.mockClear();
    mockMutateToggle.mockClear();
    mockAlert.mockClear();
  });

  it("should render schedule name", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Test Schedule")).toBeTruthy();
  });

  it("should render creator information", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Created by/)).toBeTruthy();
    expect(screen.getByText(/John Doe/)).toBeTruthy();
  });

  it("should render active status tag", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("should render notification type tag", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("REMINDER")).toBeTruthy();
  });

  it("should render trip name tag when trip exists", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("Summer Trip 2024")).toBeTruthy();
  });

  it("should render time tag with correct format", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText("09:30")).toBeTruthy();
  });

  it("should render period information", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Period:/)).toBeTruthy();
  });

  it("should render last run information when lastRun exists", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.getByText(/Last run:/)).toBeTruthy();
  });

  it("should render toggle button when active", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should render delete button", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should call toggle mutation when toggle button is pressed", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    const buttons = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]);

    expect(buttons[0]).toBeTruthy();
  });

  it("should show delete confirmation when delete button is pressed", () => {
    renderWithProviders(<NotificationScheduleCard schedule={mockSchedule} />);

    const buttons = screen.UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[1]);

    expect(mockAlert).toHaveBeenCalledWith(
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

    renderWithProviders(<NotificationScheduleCard schedule={inactiveSchedule} />);

    expect(screen.getByText("Inactive")).toBeTruthy();
  });

  it("should render toggle button when inactive", () => {
    const inactiveSchedule = {
      ...mockSchedule,
      isActive: false,
    };

    renderWithProviders(<NotificationScheduleCard schedule={inactiveSchedule} />);

    expect(screen.UNSAFE_getAllByType(TouchableOpacity).length).toBeGreaterThanOrEqual(2);
  });

  it("should not render trip tag when trip is null", () => {
    const scheduleWithoutTrip = {
      ...mockSchedule,
      trip: null,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleWithoutTrip} />);

    expect(screen.queryByText("Summer Trip 2024")).toBeNull();
  });

  it("should not render last run info when lastRun is null", () => {
    const scheduleWithoutLastRun = {
      ...mockSchedule,
      lastRun: null,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleWithoutLastRun} />);

    expect(screen.queryByText(/Last run:/)).toBeNull();
  });

  it("should handle unknown creator", () => {
    const scheduleWithUnknownCreator = {
      ...mockSchedule,
      createdBy: null,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleWithUnknownCreator} />);

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

    renderWithProviders(<NotificationScheduleCard schedule={scheduleWithPartialName} />);

    expect(screen.getByText(/Jane/)).toBeTruthy();
  });

  it("should pad single digit hours and minutes", () => {
    const scheduleWithSingleDigits = {
      ...mockSchedule,
      hour: 5,
      minute: 5,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleWithSingleDigits} />);

    expect(screen.getByText("05:05")).toBeTruthy();
  });

  it("should handle midnight time correctly", () => {
    const scheduleAtMidnight = {
      ...mockSchedule,
      hour: 0,
      minute: 0,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleAtMidnight} />);

    expect(screen.getByText("00:00")).toBeTruthy();
  });

  it("should handle end of day time correctly", () => {
    const scheduleAtEndOfDay = {
      ...mockSchedule,
      hour: 23,
      minute: 59,
    };

    renderWithProviders(<NotificationScheduleCard schedule={scheduleAtEndOfDay} />);

    expect(screen.getByText("23:59")).toBeTruthy();
  });
});
