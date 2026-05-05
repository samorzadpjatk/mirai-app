import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { fireEvent } from "@testing-library/react-native";
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

jest.mock("@mirai-app/trpc/client", () => ({
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
}));

const mockUseQueryClient = jest.fn(() => ({
  invalidateQueries: mockInvalidateQueries,
}));

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
      setQueryDefaults = jest.fn();
      getQueryState = jest.fn();
      removeQueries = jest.fn();
      removeQueryCache = jest.fn();
      setMutationCache = jest.fn();
      getMutationCache = jest.fn();
      executeMutation = jest.fn();
      getLogger = jest.fn(() => ({ log: jest.fn(), error: jest.fn() }));
      defaultOptions = {};
    },
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
    useQueryClient: () => mockUseQueryClient(),
    useMutation: jest.fn((options) => ({
      mutate: jest.fn((args) => {
        mockMutate(args);
        if (options?.onSuccess) {
          options.onSuccess();
        }
      }),
      isPending: false,
      error: null,
    })),
  };
});

jest.mock("~/components/common/ui", () => ({
  AppModalShell: function MockAppModalShell(props: { children: React.ReactNode; visible: boolean; title: string }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    if (!props.visible) return null;
    return React.createElement(View, { testID: "modal-shell" },
      React.createElement(Text, { testID: "modal-title" }, props.title),
      props.children
    );
  },
  AppModalFooter: function MockAppModalFooter(props: {
    primaryLabel: string;
    onPrimary: () => void;
    isPrimaryLoading: boolean;
    isPrimaryDisabled: boolean;
    secondaryLabel: string;
    onSecondary: () => void;
  }) {
    const React = require("react");
    const { View, Text, TouchableOpacity } = require("react-native");
    return React.createElement(View, { testID: "modal-footer" },
      React.createElement(
        TouchableOpacity,
        { testID: "primary-button", onPress: props.onPrimary, disabled: props.isPrimaryDisabled },
        React.createElement(Text, null, props.isPrimaryLoading ? "Loading..." : props.primaryLabel)
      ),
      React.createElement(
        TouchableOpacity,
        { testID: "secondary-button", onPress: props.onSecondary },
        React.createElement(Text, null, props.secondaryLabel)
      )
    );
  },
  FormField: function MockFormField(props: { children: React.ReactNode; label: string; required?: boolean; style?: object }) {
    const React = require("react");
    const { View, Text } = require("react-native");
    return React.createElement(View, { testID: "form-field", style: props.style },
      React.createElement(Text, { testID: "field-label" }, `${props.label}${props.required ? " *" : ""}`),
      props.children
    );
  },
  ThemedTextInput: function MockThemedTextInput(props: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: string;
  }) {
    const React = require("react");
    const { TextInput } = require("react-native");
    return React.createElement(TextInput, {
      testID: "text-input",
      placeholder: props.placeholder,
      value: props.value,
      onChangeText: props.onChangeText,
      keyboardType: props.keyboardType,
    });
  },
  SegmentedOption: function MockSegmentedOption(props: {
    label: string;
    selected: boolean;
    onPress: () => void;
    style?: object;
  }) {
    const React = require("react");
    const { TouchableOpacity, Text } = require("react-native");
    return React.createElement(
      TouchableOpacity,
      { testID: `segment-${props.label}`, onPress: props.onPress, "data-selected": props.selected, style: props.style },
      React.createElement(Text, null, props.label)
    );
  },
}));

describe("CreateScheduleModal", () => {
  beforeEach(() => {
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

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreated: mockOnCreated,
  };

  it("should render modal with title", () => {
    const { getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByTestId("modal-title").children[0]).toBe("Create Notification Schedule");
  });

  it("should render description text", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Schedule a notification to be sent at specific times")).toBeTruthy();
  });

  it("should render schedule name field", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Schedule Name *")).toBeTruthy();
  });

  it("should render notification type selection", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Notification Type")).toBeTruthy();
    expect(getByText("Custom Message")).toBeTruthy();
    expect(getByText("Ranking Update")).toBeTruthy();
  });

  it("should render custom message fields when custom type is selected", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Notification Title *")).toBeTruthy();
    expect(getByText("Notification Body *")).toBeTruthy();
  });

  it("should render trip selection when ranking type is selected", () => {
    const { getByText, getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    expect(getByText("Trip *")).toBeTruthy();
    expect(getByText("Summer Trip 2024")).toBeTruthy();
    expect(getByText("Winter Trip 2024")).toBeTruthy();
  });

  it("should render date fields", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Start Date *")).toBeTruthy();
    expect(getByText("End Date *")).toBeTruthy();
  });

  it("should render time fields", () => {
    const { getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByText("Hour (0-23) *")).toBeTruthy();
    expect(getByText("Minute (0-59) *")).toBeTruthy();
  });

  it("should render footer buttons", () => {
    const { getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    expect(getByTestId("primary-button")).toBeTruthy();
    expect(getByTestId("secondary-button")).toBeTruthy();
  });

  it("should call onClose when cancel button is pressed", () => {
    const { getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("secondary-button"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should update schedule name when typing", () => {
    const { getAllByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    const inputs = getAllByTestId("text-input");
    fireEvent.changeText(inputs[0], "Daily Reminder");

    expect(inputs[0].props.value).toBe("Daily Reminder");
  });

  it("should switch notification type", () => {
    const { getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    expect(getByTestId("segment-Ranking Update").props["data-selected"]).toBe(true);
  });

  it("should select trip when ranking type is active", () => {
    const { getByTestId, getAllByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    const tripSegments = getAllByTestId(/segment-/).filter((el) =>
      el.props.testID?.includes("Summer") || el.props.testID?.includes("Winter")
    );
    expect(tripSegments.length).toBeGreaterThan(0);
  });

  it("should show no trips message when trips array is empty", () => {
    mockUseTrips.mockReturnValue({
      trips: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    const { getByTestId, getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    expect(getByText("(No trips available)")).toBeTruthy();
  });

  it("should show load more button when hasNextPage is true", () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    const { getByTestId, getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    expect(getByText("Load more trips")).toBeTruthy();
  });

  it("should call fetchNextPage when load more is pressed", () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    });

    const { getByTestId, getByText } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));
    fireEvent.press(getByText("Load more trips"));

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should show loading indicator when fetching next page", () => {
    mockUseTrips.mockReturnValue({
      trips: [{ id: "trip-1", name: "Trip 1" }],
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: mockFetchNextPage,
    });

    const { getByTestId, UNSAFE_getAllByType } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    fireEvent.press(getByTestId("segment-Ranking Update"));

    const activityIndicators = UNSAFE_getAllByType(ActivityIndicator);
    expect(activityIndicators.length).toBeGreaterThanOrEqual(1);
  });

  it("should disable submit when required fields are empty", () => {
    const { getByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    const primaryButton = getByTestId("primary-button");
    expect(primaryButton.props.disabled).toBe(true);
  });

  it("should not render when modal is closed", () => {
    const { queryByTestId } = renderWithProviders(
      <CreateScheduleModal {...defaultProps} isOpen={false} />
    );

    expect(queryByTestId("modal-shell")).toBeNull();
  });

  it("should render scroll view for content", () => {
    const { UNSAFE_getByType } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    const scrollView = UNSAFE_getByType(ScrollView);
    expect(scrollView).toBeTruthy();
  });

  it("should handle numeric input for hour", () => {
    const { getAllByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    const inputs = getAllByTestId("text-input");
    const hourInput = inputs.find((input) => input.props.keyboardType === "numeric");

    expect(hourInput).toBeTruthy();
  });

  it("should handle numeric input for minute", () => {
    const { getAllByTestId } = renderWithProviders(<CreateScheduleModal {...defaultProps} />);

    const inputs = getAllByTestId("text-input");
    const numericInputs = inputs.filter((input) => input.props.keyboardType === "numeric");

    expect(numericInputs.length).toBeGreaterThanOrEqual(2);
  });
});
