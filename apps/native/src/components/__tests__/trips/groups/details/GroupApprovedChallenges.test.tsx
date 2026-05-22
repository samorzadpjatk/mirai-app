import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { fireEvent } from "@testing-library/react-native";
import { GroupApprovedChallenges } from "../../../../trips/groups/details/GroupApprovedChallenges";

jest.mock("~/components/trips/groups/details/SubmissionCircle", () => {
  const { Pressable, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ submission, onPress }: { submission: { submissionId: string }; onPress: () => void }) => (
      <Pressable testID={`submission-circle-${submission.submissionId}`} onPress={onPress}>
        <Text>Circle</Text>
      </Pressable>
    ),
  };
});

jest.mock("~/components/trips/groups/details/FullscreenSubmissionSlide", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ submission }: { submission: { submissionId: string } }) => (
      <View testID={`fullscreen-slide-${submission.submissionId}`} />
    ),
    formatDateTime: (date: string) => date,
  };
});

describe("GroupApprovedChallenges", () => {
  const submissions = [
    {
      submissionId: "sub-1",
      challengeId: "chal-1",
      challengeTitle: "Challenge 1",
      imageStoragePath: "path-1",
      approvedAt: "2024-01-01",
    },
    {
      submissionId: "sub-2",
      challengeId: "chal-2",
      challengeTitle: "Challenge 2",
      imageStoragePath: "path-2",
      approvedAt: "2024-01-02",
    },
  ];

  it("should render null when no submissions", () => {
    const { toJSON } = renderWithProviders(<GroupApprovedChallenges submissions={[]} />);
    expect(toJSON()).toBeNull();
  });

  it("should render challenge photos section with submissions", () => {
    const { getByText, getByTestId } = renderWithProviders(
      <GroupApprovedChallenges submissions={submissions} />,
    );

    expect(getByText("Challenge Photos")).toBeTruthy();
    expect(getByText("View all")).toBeTruthy();
    expect(getByTestId("submission-circle-sub-1")).toBeTruthy();
    expect(getByTestId("submission-circle-sub-2")).toBeTruthy();
  });

  it("should open fullscreen modal when View all is pressed", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <GroupApprovedChallenges submissions={submissions} />,
    );

    fireEvent.press(getByTestId("view-all-button"));
    expect(getByText("1/2")).toBeTruthy();
  });

  it("should open fullscreen modal when submission circle is pressed", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <GroupApprovedChallenges submissions={submissions} />,
    );

    fireEvent.press(getByTestId("submission-circle-sub-2"));
    expect(getByText("2/2")).toBeTruthy();
  });

  it("should close fullscreen modal when close button is pressed", () => {
    const { getByTestId, getByText, queryByText } = renderWithProviders(
      <GroupApprovedChallenges submissions={submissions} />,
    );

    fireEvent.press(getByTestId("view-all-button"));
    expect(getByText("1/2")).toBeTruthy();

    fireEvent.press(getByTestId("fullscreen-close-button"));
    expect(queryByText("1/2")).toBeNull();
  });

  it("should reset to first index when reopened after close", () => {
    const { getByTestId, getByText } = renderWithProviders(
      <GroupApprovedChallenges submissions={submissions} />,
    );

    fireEvent.press(getByTestId("submission-circle-sub-2"));
    expect(getByText("2/2")).toBeTruthy();

    fireEvent.press(getByTestId("fullscreen-close-button"));

    fireEvent.press(getByTestId("view-all-button"));
    expect(getByText("1/2")).toBeTruthy();
  });
});
