import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { CardStack } from "../../judgement/CardStack";

// Mock variables for jest.mock factories (must be prefixed with "mock")
const mockReact = React;

jest.mock("~/stores/judgement", () => ({
  useJudgement: jest.fn().mockReturnValue({
    currentSubmission: null,
    nextSubmission: null,
    reviewCurrent: jest.fn(),
    isReviewing: false,
    challengeScoringCategory: "JUDGED_STAFF",
  }),
}));

jest.mock("~/stores/judgement/judgementStores", () => ({
  judgementStore: {
    getState: jest.fn().mockReturnValue({
      resetDismissedIds: jest.fn(),
    }),
  },
}));

jest.mock("react-native-reanimated", () => ({
  useSharedValue: jest.fn().mockReturnValue({ value: 0 }),
  useAnimatedStyle: jest.fn().mockReturnValue({}),
  withSpring: jest.fn().mockReturnValue({ value: 0 }),
  withTiming: jest.fn().mockReturnValue({ value: 0 }),
  interpolate: jest.fn().mockReturnValue(0),
  Extrapolation: { CLAMP: "clamp" },
  default: {
    View: ({ children }: { children: React.ReactNode }) => {
      return children;
    },
  },
}));

jest.mock("react-native-gesture-handler", () => ({
  Gesture: {
    Pan: jest.fn().mockReturnValue({
      enabled: jest.fn().mockReturnThis(),
      minDistance: jest.fn().mockReturnThis(),
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    }),
  },
  GestureDetector: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    return name;
  },
}));

jest.mock("~/components/judgement/QueuedSubmissionCard", () => ({
  QueuedSubmissionCard: () => <View testID="queued-card" />,
}));

jest.mock("~/components/judgement/CurrentSubmissionCard", () => ({
  CurrentSubmissionCard: () => <View testID="current-card" />,
}));

jest.mock("~/components/judgement/EmptyStateCard", () => ({
  EmptyStateCard: () => <View testID="empty-card" />,
}));

jest.mock("~/components/judgement/ActionBar", () => ({
  ActionBar: () => <View testID="action-bar" />,
}));

describe("CardStack", () => {
  const defaultProps = {
    tripId: "trip-1",
    challengeId: "challenge-1",
  };

  it("should render empty state when no submissions", () => {
    const { getByTestId } = renderWithProviders(
      <CardStack {...defaultProps} />
    );

    expect(getByTestId("empty-card")).toBeTruthy();
  });

  it("should render action bar", () => {
    const { getByTestId } = renderWithProviders(
      <CardStack {...defaultProps} />
    );

    expect(getByTestId("action-bar")).toBeTruthy();
  });

  it("should render with provided tripId and challengeId", () => {
    const { getByTestId } = renderWithProviders(
      <CardStack tripId="trip-2" challengeId="challenge-2" />
    );

    expect(getByTestId("empty-card")).toBeTruthy();
    expect(getByTestId("action-bar")).toBeTruthy();
  });
});
