import React from "react";
import type * as ReactNative from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengesGridItem } from "../../../trips/challenges/ChallengesGridItem";
import type { ChallengeListItem } from "../../../trips/challenges/types";

jest.mock("react-native", () => {
  const actual: typeof ReactNative = jest.requireActual("react-native");
  const MockReact: typeof React = jest.requireActual("react");

  return {
    ...actual,
    ImageBackground: ({ children }: { children?: React.ReactNode }) =>
      MockReact.createElement(actual.View, {}, children),
  };
});

describe("ChallengesGridItem", () => {
  const baseChallenge: ChallengeListItem = {
    id: "1",
    title: "Test Challenge",
    points: 100,
    icon: "trophy",
    iconColor: "#00ced1",
    status: "to_solve",
    description: "Test description",
    image: undefined,
    participantGroupsCount: 5,
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    lifecycleStatus: "ACTIVE",
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the main labels", () => {
    const { getByText } = renderWithProviders(
      <ChallengesGridItem challenge={baseChallenge} onPress={mockOnPress} />
    );

    expect(getByText("Test Challenge")).toBeTruthy();
    expect(getByText("+100 MAX")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
    expect(getByText("Photo")).toBeTruthy();
    expect(getByText("Speed")).toBeTruthy();
  });

  it("calls onPress with the challenge", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ChallengesGridItem challenge={baseChallenge} onPress={mockOnPress} />
    );

    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(mockOnPress).toHaveBeenCalledWith(baseChallenge);
  });

  it("is disabled and shows a lock icon when locked", () => {
    const lockedChallenge = { ...baseChallenge, status: "locked" as const };
    const { UNSAFE_getByType, getByText } = renderWithProviders(
      <ChallengesGridItem challenge={lockedChallenge} onPress={mockOnPress} />
    );

    expect(UNSAFE_getByType(TouchableOpacity).props.disabled).toBe(true);
    expect(getByText("Locked")).toBeTruthy();
  });

  it("renders mapped labels for challenge metadata", () => {
    const variants = [
      { submissionType: "MULTI_IMAGE", label: "Multi" },
      { submissionType: "VIDEO", label: "Video" },
      { submissionType: "TEXT", label: "Text" },
      { submissionType: "IMAGE_LOCATION", label: "Photo+GPS" },
      { submissionType: "LOCATION", label: "GPS" },
      { submissionType: "QR_CODE", label: "QR" },
    ] as const;

    variants.forEach(({ submissionType, label }) => {
      const { getByText, unmount } = renderWithProviders(
        <ChallengesGridItem
          challenge={{ ...baseChallenge, submissionType }}
          onPress={mockOnPress}
        />
      );
      expect(getByText(label)).toBeTruthy();
      unmount();
    });
  });

  it("renders mapped scoring labels", () => {
    const variants = [
      { scoringCategory: "UNLIMITED", label: "Unlimited" },
      { scoringCategory: "PEER_VOTING", label: "Voting" },
      { scoringCategory: "JUDGED_STAFF", label: "Staff" },
    ] as const;

    variants.forEach(({ scoringCategory, label }) => {
      const { getByText, unmount } = renderWithProviders(
        <ChallengesGridItem
          challenge={{ ...baseChallenge, scoringCategory }}
          onPress={mockOnPress}
        />
      );
      expect(getByText(label)).toBeTruthy();
      unmount();
    });
  });
});
