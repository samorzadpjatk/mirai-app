import { fireEvent, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { ChallengesGridItem } from "../../../trips/challenges/ChallengesGridItem";
import type { ChallengeListItem } from "../../../trips/challenges/types";
import { renderWithProviders } from "../../helpers/renderWithProviders";

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
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("renders the main labels", () => {
    renderWithProviders(<ChallengesGridItem challenge={baseChallenge} onPress={mockOnPress} />);

    expect(screen.getByText("Test Challenge")).toBeOnTheScreen();
    expect(screen.getByText("+100 MAX")).toBeOnTheScreen();
    expect(screen.getByText("5")).toBeOnTheScreen();
    expect(screen.getByText("Active")).toBeOnTheScreen();
    expect(screen.getByText("Photo")).toBeOnTheScreen();
    expect(screen.getByText("Speed")).toBeOnTheScreen();
  });

  it("calls onPress with the challenge", () => {
    renderWithProviders(<ChallengesGridItem challenge={baseChallenge} onPress={mockOnPress} />);

    fireEvent.press(screen.getByTestId("challenge-card"));
    expect(mockOnPress).toHaveBeenCalledWith(baseChallenge);
  });

  it("is disabled and shows a lock icon when locked", () => {
    const lockedChallenge = { ...baseChallenge, status: "locked" as const };
    renderWithProviders(<ChallengesGridItem challenge={lockedChallenge} onPress={mockOnPress} />);

    const card = screen.getByTestId("challenge-card");
    expect(card.props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByText("Locked")).toBeOnTheScreen();
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
      renderWithProviders(
        <ChallengesGridItem
          challenge={{ ...baseChallenge, submissionType }}
          onPress={mockOnPress}
        />,
      );
      expect(screen.getByText(label)).toBeOnTheScreen();
    });
  });

  it("renders mapped scoring labels", () => {
    const variants = [
      { scoringCategory: "UNLIMITED", label: "Unlimited" },
      { scoringCategory: "PEER_VOTING", label: "Voting" },
      { scoringCategory: "JUDGED_STAFF", label: "Staff" },
    ] as const;

    variants.forEach(({ scoringCategory, label }) => {
      renderWithProviders(
        <ChallengesGridItem
          challenge={{ ...baseChallenge, scoringCategory }}
          onPress={mockOnPress}
        />,
      );
      expect(screen.getByText(label)).toBeOnTheScreen();
    });
  });
});
