import React from "react";
import { View, Alert } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { fireEvent } from "@testing-library/react-native";
import { CardStack } from "../../judgement/CardStack";

// Mock variables for jest.mock factories (must be prefixed with "mock")
const mockReact = React;

import type { Submission } from "~/stores/judgement/judgementStores";

const baseSubmission = (overrides?: Partial<Submission>): Submission => ({
  id: "sub-default",
  status: "PENDING",
  imageIds: [],
  videoId: null,
  textContent: null,
  latitude: null,
  longitude: null,
  createdAt: "2024-01-01T00:00:00Z",
  group: {
    id: "group-1",
    name: "Test Group",
    description: null,
    image: null,
  },
  ...overrides,
});

let mockUseJudgementReturn: {
  currentSubmission: Submission | null;
  nextSubmission: Submission | null;
  reviewCurrent: jest.Mock;
  isReviewing: boolean;
  challengeScoringCategory: string;
} = {
  currentSubmission: null,
  nextSubmission: null,
  reviewCurrent: jest.fn(),
  isReviewing: false,
  challengeScoringCategory: "JUDGED_STAFF",
};

jest.mock("~/stores/judgement", () => ({
  useJudgement: jest.fn().mockImplementation(() => mockUseJudgementReturn),
}));

jest.mock("~/stores/judgement/judgementStores", () => ({
  judgementStore: {
    getState: jest.fn().mockReturnValue({
      resetDismissedIds: jest.fn(),
    }),
  },
}));

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  return {
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
  };
});

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  return {
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
  };
});

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => {
    return name;
  },
}));

jest.mock("~/components/judgement/QueuedSubmissionCard", () => {
  const { View } = require("react-native");
  return {
    QueuedSubmissionCard: () => <View testID="queued-card" />,
  };
});

jest.mock("~/components/judgement/CurrentSubmissionCard", () => {
  const { View } = require("react-native");
  return {
    CurrentSubmissionCard: () => <View testID="current-card" />,
  };
});

jest.mock("~/components/judgement/EmptyStateCard", () => {
  const { View } = require("react-native");
  return {
    EmptyStateCard: () => <View testID="empty-card" />,
  };
});

jest.mock("~/components/judgement/ActionBar", () => {
  const { Pressable, Text } = require("react-native");
  return {
    ActionBar: ({
      onReject,
      onApprove,
      disabled,
    }: {
      onReject: () => void;
      onApprove: () => void;
      disabled: boolean;
    }) => (
      <>
        <Pressable testID="reject-button" onPress={onReject} disabled={disabled}>
          <Text>Reject</Text>
        </Pressable>
        <Pressable testID="approve-button" onPress={onApprove} disabled={disabled}>
          <Text>Approve</Text>
        </Pressable>
      </>
    ),
  };
});

describe("CardStack", () => {
  const defaultProps = {
    tripId: "trip-1",
    challengeId: "challenge-1",
  };

  beforeEach(() => {
    mockUseJudgementReturn = {
      currentSubmission: null,
      nextSubmission: null,
      reviewCurrent: jest.fn(),
      isReviewing: false,
      challengeScoringCategory: "JUDGED_STAFF",
    };
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render empty state when no submissions", () => {
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    expect(getByTestId("empty-card")).toBeTruthy();
  });

  it("should render action bar", () => {
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    expect(getByTestId("reject-button")).toBeTruthy();
    expect(getByTestId("approve-button")).toBeTruthy();
  });

  it("should render with provided tripId and challengeId", () => {
    const { getByTestId } = renderWithProviders(
      <CardStack tripId="trip-2" challengeId="challenge-2" />,
    );

    expect(getByTestId("empty-card")).toBeTruthy();
  });

  it("should render current submission card when submission exists", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    const { getByTestId, queryByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    expect(getByTestId("current-card")).toBeTruthy();
    expect(queryByTestId("empty-card")).toBeNull();
  });

  it("should render queued submission card when next submission exists", () => {
    mockUseJudgementReturn.nextSubmission = baseSubmission({ id: "sub-2" });
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    expect(getByTestId("queued-card")).toBeTruthy();
  });

  it("should open reject modal when reject button pressed", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    const { getByTestId, getByText } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("reject-button"));

    expect(getByText("Reject submission")).toBeTruthy();
    expect(getByText("Add a short reason for the team.")).toBeTruthy();
  });

  it("should not open reject modal when reviewing", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    mockUseJudgementReturn.isReviewing = true;
    const { getByTestId, queryByText } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("reject-button"));

    expect(queryByText("Reject submission")).toBeNull();
  });

  it("should show approve alert for judged staff challenges", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    mockUseJudgementReturn.challengeScoringCategory = "JUDGED_STAFF";
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("approve-button"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Approve submission",
      "Select podium place",
      expect.any(Array),
    );
  });

  it("should directly approve for non-staff judged challenges", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    mockUseJudgementReturn.challengeScoringCategory = "AUTO_APPROVED";
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("approve-button"));

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("should not open approve selection when reviewing", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    mockUseJudgementReturn.isReviewing = true;
    const { getByTestId } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("approve-button"));

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("should close reject modal when cancel pressed", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <CardStack {...defaultProps} />,
    );

    fireEvent.press(getByTestId("reject-button"));
    expect(getByText("Reject submission")).toBeTruthy();

    fireEvent.press(getByTestId("reject-cancel-button"));
    expect(queryByText("Reject submission")).toBeNull();
  });

  it("should confirm reject with reason and close modal", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    const { getByTestId, getByText, queryByText, getByPlaceholderText } = renderWithProviders(
      <CardStack {...defaultProps} />,
    );

    fireEvent.press(getByTestId("reject-button"));
    expect(getByText("Reject submission")).toBeTruthy();

    const input = getByPlaceholderText("Why was this rejected?");
    fireEvent.changeText(input, "Not valid");

    fireEvent.press(getByTestId("reject-confirm-button"));
    expect(queryByText("Reject submission")).toBeNull();
  });

  it("should not confirm reject when reason is empty", () => {
    mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
    const { getByTestId, getByText } = renderWithProviders(<CardStack {...defaultProps} />);

    fireEvent.press(getByTestId("reject-button"));
    expect(getByText("Reject submission")).toBeTruthy();

    fireEvent.press(getByTestId("reject-confirm-button"));
    expect(getByText("Reject submission")).toBeTruthy();
  });
});
