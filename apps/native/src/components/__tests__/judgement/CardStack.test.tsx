import { fireEvent } from "@testing-library/react-native";
import React from "react";
import { Alert, View } from "react-native";
import { runOnJS, withSpring, withTiming } from "react-native-reanimated";
import { CardStack } from "../../judgement/CardStack";
import { renderWithProviders } from "../helpers/renderWithProviders";

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

// Shared values created during a render, in creation order: [translateX, translateY].
const mockSharedValues: { value: number }[] = [];

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  return {
    useSharedValue: jest.fn().mockImplementation((initial: number) => {
      const sharedValue = { value: initial };
      mockSharedValues.push(sharedValue);
      return sharedValue;
    }),
    useAnimatedStyle: jest.fn().mockReturnValue({}),
    withSpring: jest.fn().mockReturnValue({ value: 0 }),
    withTiming: jest.fn().mockReturnValue({ value: 0 }),
    interpolate: jest.fn().mockReturnValue(0),
    // Stands in for the thread hop: records the target and forwards the call.
    runOnJS: jest.fn(
      (fn: (...args: unknown[]) => unknown) =>
        (...args: unknown[]) =>
          fn(...args),
    ),
    Extrapolation: { CLAMP: "clamp" },
    default: {
      View: ({ children }: { children: React.ReactNode }) => {
        return children;
      },
    },
  };
});

// Pan callbacks registered by the component, so tests can run them like the UI thread would.
const mockPanCallbacks: {
  onUpdate?: (event: { translationX: number; translationY: number }) => void;
  onEnd?: () => void;
} = {};

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  return {
    Gesture: {
      Pan: jest.fn().mockReturnValue({
        enabled: jest.fn().mockReturnThis(),
        minDistance: jest.fn().mockReturnThis(),
        onUpdate: jest.fn(function (this: unknown, callback: () => void) {
          mockPanCallbacks.onUpdate = callback as typeof mockPanCallbacks.onUpdate;
          return this;
        }),
        onEnd: jest.fn(function (this: unknown, callback: () => void) {
          mockPanCallbacks.onEnd = callback;
          return this;
        }),
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
    mockSharedValues.length = 0;
    mockPanCallbacks.onUpdate = undefined;
    mockPanCallbacks.onEnd = undefined;
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

  /**
   * The pan callbacks are workletized by react-native-worklets, so their body runs on the UI
   * thread. Calling a plain JS function from there kills the app with "Tried to synchronously
   * call a non-worklet function on the UI thread", which is exactly how swiping a card crashed.
   * Every hop back into JS must therefore go through runOnJS.
   */
  describe("pan gesture end (runs on the UI thread)", () => {
    const SWIPE_PAST_THRESHOLD = 9999;

    const renderWithSwipe = (distanceX: number) => {
      const rendered = renderWithProviders(<CardStack {...defaultProps} />);
      const [translateX] = mockSharedValues;
      if (!translateX) throw new Error("translateX shared value was never created");
      translateX.value = distanceX;
      return rendered;
    };

    const runPanEnd = () => {
      if (!mockPanCallbacks.onEnd) throw new Error("onEnd callback was never registered");
      mockPanCallbacks.onEnd();
    };

    it("should approve a right swipe through runOnJS instead of calling JS directly", () => {
      mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
      mockUseJudgementReturn.challengeScoringCategory = "AUTO_APPROVED";
      renderWithSwipe(SWIPE_PAST_THRESHOLD);

      runPanEnd();

      expect(runOnJS).toHaveBeenCalledTimes(1);
      expect(withTiming).toHaveBeenCalledWith(
        expect.any(Number),
        { duration: 220 },
        expect.any(Function),
      );
      expect((withTiming as jest.Mock).mock.calls[0]?.[0]).toBeGreaterThan(0);
    });

    it("should open the reject flow of a left swipe through runOnJS", () => {
      mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
      mockUseJudgementReturn.challengeScoringCategory = "AUTO_APPROVED";
      renderWithSwipe(-SWIPE_PAST_THRESHOLD);

      runPanEnd();

      expect(runOnJS).toHaveBeenCalledTimes(1);
      expect((withTiming as jest.Mock).mock.calls[0]?.[0]).toBeLessThan(0);
    });

    it("should spring the card back through runOnJS when the swipe is too short", () => {
      mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
      mockUseJudgementReturn.challengeScoringCategory = "AUTO_APPROVED";
      renderWithSwipe(1);

      runPanEnd();

      expect(runOnJS).toHaveBeenCalledTimes(1);
      expect(withSpring).toHaveBeenCalled();
      expect(withTiming).not.toHaveBeenCalled();
    });

    it("should spring back and open podium selection through runOnJS for judged staff", () => {
      mockUseJudgementReturn.currentSubmission = baseSubmission({ id: "sub-1" });
      mockUseJudgementReturn.challengeScoringCategory = "JUDGED_STAFF";
      renderWithSwipe(SWIPE_PAST_THRESHOLD);

      runPanEnd();

      expect(runOnJS).toHaveBeenCalledTimes(2);
      expect(withSpring).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "Approve submission",
        "Select podium place",
        expect.any(Array),
      );
    });
  });
});
