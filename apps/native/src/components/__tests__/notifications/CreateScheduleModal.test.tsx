import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { CreateScheduleModal } from "../../notifications/CreateScheduleModal";

const mockOnClose = jest.fn();
const mockOnCreated = jest.fn();

const defaultTrips = [
  { id: "trip-1", name: "Summer Trip 2024" },
  { id: "trip-2", name: "Winter Trip 2024" },
];

const createTripHandler = (trips: unknown[], hasMore: boolean, offset = 0, limit = 20) =>
  createORPCHandler(["trip", "getAll"], () => ({
    trips,
    pagination: { hasMore, offset, limit },
  }));

// Helper that runs pending timers after render
const renderWithTimers = async (component: React.ReactElement) => {
  const rendered = renderWithMSW(component);
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  return rendered;
};

describe("CreateScheduleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    server.resetHandlers();
    server.use(createTripHandler(defaultTrips, false));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreated: mockOnCreated,
  };

  // === Rendering tests (same as before, just swap render helper) ===
  it("should render modal with title", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Create Notification Schedule")).toBeTruthy();
  });

  it("should render description text", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Schedule a notification to be sent at specific times")).toBeTruthy();
  });

  it("should render schedule name field", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Schedule Name *")).toBeTruthy();
  });

  it("should render notification type selection", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Notification Type")).toBeTruthy();
    expect(screen.getByText(/Custom Message/)).toBeTruthy();
    expect(screen.getByText(/Ranking Update/)).toBeTruthy();
  });

  it("should render custom message fields when custom type is selected", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Notification Title *")).toBeTruthy();
    expect(screen.getByText("Notification Body *")).toBeTruthy();
  });

  it("should render trip selection when ranking type is selected", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText("Trip *")).toBeTruthy();
    expect(screen.getByText(/Summer Trip 2024/)).toBeTruthy();
    expect(screen.getByText(/Winter Trip 2024/)).toBeTruthy();
  });

  it("should render date fields", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Start Date *")).toBeTruthy();
    expect(screen.getByText("End Date *")).toBeTruthy();
  });

  it("should render time fields", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByText("Hour (0-23) *")).toBeTruthy();
    expect(screen.getByText("Minute (0-59) *")).toBeTruthy();
  });

  it("should render footer buttons", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    expect(screen.getByTestId("app-modal-footer-primary")).toBeTruthy();
    expect(screen.getByTestId("app-modal-footer-secondary")).toBeTruthy();
  });

  it("should call onClose when cancel button is pressed", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("app-modal-footer-secondary"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should update schedule name when typing", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    const inputs = screen.getAllByTestId("themed-text-input");
    fireEvent.changeText(inputs[0]!, "Daily Reminder");
    expect(inputs[0]!.props.value).toBe("Daily Reminder");
  });

  it("should switch notification type", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText("Notification Title *")).toBeTruthy();
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText("Trip *")).toBeTruthy();
  });

  it("should select trip when ranking type is active", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText(/Summer Trip 2024/)).toBeTruthy();
    expect(screen.getByText(/Winter Trip 2024/)).toBeTruthy();
  });

  it("should show no trips message when trips array is empty", async () => {
    server.use(createTripHandler([], false));
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText("(No trips available)")).toBeTruthy();
  });

  it("should show load more button when hasNextPage is true", async () => {
    server.use(createTripHandler([{ id: "trip-1", name: "Trip 1" }], true));
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByText("Load more trips")).toBeTruthy();
  });

  it("should call fetchNextPage when load more is pressed", async () => {
    const secondPageHandler = jest.fn(() => ({
      trips: [{ id: "trip-2", name: "Trip 2" }],
      pagination: { hasMore: false, offset: 20, limit: 20 },
    }));
    server.use(
      createORPCHandler(["trip", "getAll"], (input) => {
        const typedInput = input as { pagination?: { offset: number } };
        if (typedInput.pagination?.offset === 0) {
          return {
            trips: [{ id: "trip-1", name: "Trip 1" }],
            pagination: { hasMore: true, offset: 0, limit: 20 },
          };
        }
        return secondPageHandler();
      }),
    );
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.press(screen.getByText("Load more trips"));
    await waitFor(() => expect(secondPageHandler).toHaveBeenCalled());
  });

  it("should show loading indicator when fetching next page", async () => {
    // Use a slow handler for the second page so isFetchingNextPage stays true
    let resolveSecondPage: ((value: unknown) => void) | undefined;
    server.use(
      createORPCHandler(["trip", "getAll"], (input) => {
        const typedInput = input as { pagination?: { offset: number } };
        if (typedInput.pagination?.offset === 0) {
          return {
            trips: [{ id: "trip-1", name: "Trip 1" }],
            pagination: { hasMore: true, offset: 0, limit: 20 },
          };
        }
        return new Promise((resolve) => {
          resolveSecondPage = resolve;
        });
      }),
    );
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    fireEvent.press(screen.getByTestId("segmented-option-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.press(screen.getByText("Load more trips"));
    // Wait for React Query to update isFetchingNextPage state
    await waitFor(() => {
      expect(screen.getByTestId("loading-indicator")).toBeTruthy();
    });
    if (resolveSecondPage) {
      resolveSecondPage({
        trips: [{ id: "trip-2", name: "Trip 2" }],
        pagination: { hasMore: false, offset: 20, limit: 20 },
      });
    }
  });

  it("should disable submit when required fields are empty", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    const primaryButton = screen.getByTestId("app-modal-footer-primary");
    expect(primaryButton.props.accessibilityState?.disabled ?? primaryButton.props.disabled).toBe(
      true,
    );
  });

  it("should not render when modal is closed", async () => {
    renderWithMSW(<CreateScheduleModal {...defaultProps} isOpen={false} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.queryByTestId("app-modal")).toBeNull();
  });

  it("should render scroll view for content", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    const scrollView = screen.getByTestId("schedule-modal-scrollview");
    expect(scrollView).toBeTruthy();
  });

  it("should handle numeric input for hour", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    const inputs = screen.getAllByTestId("themed-text-input");
    const hourInput = inputs.find((input) => input.props.keyboardType === "numeric");
    expect(hourInput).toBeTruthy();
  });

  it("should handle numeric input for minute", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);
    const inputs = screen.getAllByTestId("themed-text-input");
    const numericInputs = inputs.filter((input) => input.props.keyboardType === "numeric");
    expect(numericInputs.length).toBeGreaterThanOrEqual(2);
  });
});
