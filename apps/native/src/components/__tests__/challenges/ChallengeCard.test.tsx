import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ChallengeCard } from "../../challenges/ChallengeCard";
import { ChallengeStatus, type Challenge } from "../../../types/challenges";

interface IoniconsProps {
  name: string;
}

jest.mock("@expo/vector-icons", () => {
   
  const React = jest.requireActual<typeof import("react")>("react");
   
  const { Text } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Ionicons: ({ name }: IoniconsProps) => <Text testID={`icon-${name}`}>{name}</Text>,
  };
});

const mockChallenge: Challenge = { id: "1", title: "Test Challenge", description: "A test challenge description", points: 100, icon: "trophy", iconColor: "#FFD700", status: ChallengeStatus.INCOMPLETE, size: "normal" };
const mockWideChallenge: Challenge = { ...mockChallenge, id: "2", size: "wide" };
const mockTallChallenge: Challenge = { ...mockChallenge, id: "3", size: "tall", participantAvatars: ["https://example.com/avatar1.jpg"], additionalParticipants: 2 };
const mockLockedChallenge: Challenge = { ...mockChallenge, id: "4", status: ChallengeStatus.LOCKED };
const mockSelectedChallenge: Challenge = { ...mockChallenge, id: "5", status: ChallengeStatus.SELECTED };
const mockCompletedChallenge: Challenge = { ...mockChallenge, id: "6", status: ChallengeStatus.COMPLETED };

describe("ChallengeCard", () => {
  it("renders the challenge title and icon", () => {
    renderWithProviders(<ChallengeCard challenge={mockChallenge} />);
    expect(screen.getByText("Test Challenge")).toBeTruthy();
    expect(screen.getByTestId("icon-trophy")).toBeTruthy();
  });

  it("renders the wide description", () => {
    renderWithProviders(<ChallengeCard challenge={mockWideChallenge} />);
    expect(screen.getByText("A test challenge description")).toBeTruthy();
  });

  it("renders the correct status text", () => {
    renderWithProviders(<ChallengeCard challenge={mockChallenge} />);
    expect(screen.getByText("Incomplete")).toBeTruthy();
    
    renderWithProviders(<ChallengeCard challenge={mockSelectedChallenge} />);
    expect(screen.getByText("Selected")).toBeTruthy();
    
    renderWithProviders(<ChallengeCard challenge={mockCompletedChallenge} />);
    expect(screen.getByText("Completed")).toBeTruthy();
    
    renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} />);
    expect(screen.getByText("Locked")).toBeTruthy();
  });

  it("renders the locked icon", () => {
    renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} />);
    expect(screen.getByTestId("icon-lock-closed")).toBeTruthy();
  });

  it("calls onPress when unlocked", () => {
    const onPress = jest.fn();
    renderWithProviders(<ChallengeCard challenge={mockChallenge} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("challenge-card"));
    expect(onPress).toHaveBeenCalledWith(mockChallenge);
  });

  it("does not call onPress when locked", () => {
    const onPress = jest.fn();
    renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("challenge-card"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders tall layout extras", () => {
    renderWithProviders(<ChallengeCard challenge={mockTallChallenge} />);
    expect(screen.getByText("+2")).toBeTruthy();
  });
});
