import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CreateScheduleModal } from "../../notifications/CreateScheduleModal";

const mockMutate = jest.fn();
const mockInvalidateQueries = jest.fn(() => Promise.resolve());
const mockOnClose = jest.fn();
const mockOnCreated = jest.fn();
const mockFetchNextPage = jest.fn();

const mockUseTrips = jest.fn(() => ({
  trips: [
    { id: "trip-1", name: "Summer Trip 2024" },
    { id: "trip-2", name: "Winter Trip 2024" },
  ],
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: mockFetchNextPage,
}));

jest.mock("~/hooks/trips", () => ({
  useTrips: () => mockUseTrips(),
}));

jest.mock("@mirai-app/orpc/client", () => ({
  useTRPC: () => ({
    notificationSchedule: {
      create: {
        mutationOptions: () => ({
          mutationFn: mockMutate,
        }),
      },
      getAll: {
        queryOptions: () => ({
          queryKey: ["notificationSchedule", "getAll"],
        }),
      },
    },
  }),
  orpc: {
    notificationSchedule: {
      create: {
        mutationOptions: () => ({
          mutationFn: mockMutate,
        }),
      },
      getAll: {
        queryOptions: () => ({
          queryKey: ["notificationSchedule", "getAll"],
        }),
      },
    },
  },
}));

const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

interface UseMutationOptions {
  onSuccess?: () => void;
}

interface AppModalShellProps {
  children: React.ReactNode;
  visible: boolean;
  title: string;
}

interface AppModalFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  isPrimaryLoading: boolean;
  isPrimaryDisabled: boolean;
  secondaryLabel: string;
  onSecondary: () => void;
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  required?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface ThemedTextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: TextInputProps["keyboardType"];
}

interface SegmentedOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

jest.mock("@tanstack/react-query", () => {
  return {
    QueryClient: class MockQueryClient {
      mount = jest.fn();
      unmount = jest.fn();
      isFetching = jest.fn(() => 0);
      getQueryCache = jest.fn(() => ({ subscribe: jest.fn() }));
      getMutationCache = jest.fn(() => ({ subscribe: jest.fn() }));
      getDefaultOptions = jest.fn(() => ({}));
      setDefaultOptions = jest.fn();
      getQueryDefaults = jest.fn();
      setQueryDefaults = jest.fn();
      getMutationDefaults = jest.fn();
      setMutationDefaults = jest.fn();
      clear = jest.fn();
      resetQueries = jest.fn();
      cancelQueries = jest.fn();
      invalidateQueries = jest.fn();
      refetchQueries = jest.fn();
      fetchQuery = jest.fn();
      prefetchQuery = jest.fn();
      fetchInfiniteQuery = jest.fn();
      prefetchInfiniteQuery = jest.fn();
      setQueryData = jest.fn();
      getQueryData = jest.fn();
      getQueriesData = jest.fn();
      setQueriesData = jest.fn();
      getQueryState = jest.fn();
      removeQueries = jest.fn();
      removeQueryCache = jest.fn();
      setMutationCache = jest.fn();
      executeMutation = jest.fn();
      getLogger = jest.fn(() => ({ log: jest.fn(), error: jest.fn() }));
      defaultOptions = {};
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useQueryClient: () => mockUseQueryClient(),
    useMutation: jest.fn((options: UseMutationOptions | undefined) => ({
      mutate: jest.fn((args: unknown) => {
        mockMutate(args);
        options?.onSuccess?.();
      }),
      isPending: false,
      error: null,
    })),
  };
});

jest.mock("~/components/common/ui", () => {
  const { View, Text, TouchableOpacity, TextInput } = jest.requireActual("react-native");
  return {
    AppModalShell: ({ children, visible, title }: AppModalShellProps) =>
      !visible ? null : (
        <View testID="modal-shell">
          <Text testID="modal-title">{title}</Text>
          {children}
        </View>
      ),
    AppModalFooter: ({
      primaryLabel,
      onPrimary,
      isPrimaryLoading,
      isPrimaryDisabled,
      secondaryLabel,
      onSecondary,
    }: AppModalFooterProps) => (
      <View testID="modal-footer">
        <TouchableOpacity testID="primary-button" onPress={onPrimary} disabled={isPrimaryDisabled}>
          <Text testID="primary-button-text">{isPrimaryLoading ? "Loading..." : primaryLabel}{isPrimaryDisabled ? " [disabled]" : ""}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="secondary-button" onPress={onSecondary}>
          <Text>{secondaryLabel}</Text>
        </TouchableOpacity>
      </View>
    ),
    FormField: ({ children, label, required, style }: FormFieldProps) => (
      <View testID="form-field" style={style}>
        <Text testID="field-label">{`${label}${required ? " *" : ""}`}</Text>
        {children}
      </View>
    ),
    ThemedTextInput: ({ placeholder, value, onChangeText, keyboardType }: ThemedTextInputProps) => (
      <TextInput
        testID="text-input"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    ),
    SegmentedOption: ({ label, selected, onPress, style }: SegmentedOptionProps) => (
      <TouchableOpacity
        testID={`segment-${label}`}
        onPress={onPress}
        accessibilityState={{ selected }}
        style={style}
      >
        <Text testID={`segment-${label}-text`}>{label}{selected ? ' (selected)' : ''}</Text>
      </TouchableOpacity>
    ),
  };
});

describe("CreateScheduleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseTrips.mockReturnValue({
      trips: [
        { id: "trip-1", name: "Summer Trip 2024" },
        { id: "trip-2", name: "Winter Trip 2024" },
      ],
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreated: mockOnCreated,
  };

  const renderWithTimers = async (component: React.ReactElement) => {
    const rendered = renderWithProviders(component);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    return rendered;
  };

  it("should render modal with title", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    expect(screen.getByTestId("modal-title").children[0]).toBe("Create Notification Schedule");
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

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
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

    expect(screen.getByTestId("primary-button")).toBeTruthy();
    expect(screen.getByTestId("secondary-button")).toBeTruthy();
  });

  it("should call onClose when cancel button is pressed", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("secondary-button"));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should update schedule name when typing", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    const inputs = screen.getAllByTestId("text-input");
    fireEvent.changeText(inputs[0]!, "Daily Reminder");

    expect(inputs[0]!.props.value).toBe("Daily Reminder");
  });

  it("should switch notification type", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // Initially, custom message fields should be visible
    expect(screen.getByText("Notification Title *")).toBeTruthy();

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // After switching to ranking, trip selection should be visible
    expect(screen.getByText("Trip *")).toBeTruthy();
  });

  it("should select trip when ranking type is active", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText(/Summer Trip 2024/)).toBeTruthy();
    expect(screen.getByText(/Winter Trip 2024/)).toBeTruthy();
  });

  it("should show no trips message when trips array is empty", async () => {
    mockUseTrips.mockReturnValue({
      trips: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("(No trips available)")).toBeTruthy();
  });

  it("should show load more button when hasNextPage is true", async () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByText("Load more trips")).toBeTruthy();
  });

  it("should call fetchNextPage when load more is pressed", async () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    fireEvent.press(screen.getByText("Load more trips"));

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should show loading indicator when fetching next page", async () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: mockFetchNextPage,
    });

    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(screen.getByTestId("segment-Ranking Update"));
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    const loadingIndicator = screen.getByTestId("loading-indicator");
    expect(loadingIndicator).toBeTruthy();
  });

  it("should disable submit when required fields are empty", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    const primaryButton = screen.getByTestId("primary-button");
    expect(primaryButton.props.accessibilityState?.disabled ?? primaryButton.props.disabled).toBe(true);
  });

  it("should not render when modal is closed", async () => {
    renderWithProviders(<CreateScheduleModal {...defaultProps} isOpen={false} />);
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.queryByTestId("modal-shell")).toBeNull();
  });

  it("should render scroll view for content", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    const scrollView = screen.getByTestId("schedule-modal-scrollview");
    expect(scrollView).toBeTruthy();
  });

  it("should handle numeric input for hour", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    const inputs = screen.getAllByTestId("text-input");
    const hourInput = inputs.find((input) => input.props.keyboardType === "numeric");

    expect(hourInput).toBeTruthy();
  });

  it("should handle numeric input for minute", async () => {
    await renderWithTimers(<CreateScheduleModal {...defaultProps} />);

    const inputs = screen.getAllByTestId("text-input");
    const numericInputs = inputs.filter((input) => input.props.keyboardType === "numeric");

    expect(numericInputs.length).toBeGreaterThanOrEqual(2);
  });
});
