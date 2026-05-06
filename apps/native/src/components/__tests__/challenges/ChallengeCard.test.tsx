import { TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ChallengeCard } from "../../challenges/ChallengeCard";
import { ChallengeStatus, type Challenge } from "../../../types/challenges";

interface IoniconsProps {
  name: string;
}

jest.mock("@expo/vector-icons", () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = jest.requireActual<typeof import("react")>("react");
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
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
    const { getByText, getByTestId } = renderWithProviders(<ChallengeCard challenge={mockChallenge} />);
    expect(getByText("Test Challenge")).toBeTruthy();
    expect(getByTestId("icon-trophy")).toBeTruthy();
  });

  it("renders the wide description", () => {
    const { getByText } = renderWithProviders(<ChallengeCard challenge={mockWideChallenge} />);
    expect(getByText("A test challenge description")).toBeTruthy();
  });

  it("renders the correct status text", () => {
    expect(renderWithProviders(<ChallengeCard challenge={mockChallenge} />).getByText("Incomplete")).toBeTruthy();
    expect(renderWithProviders(<ChallengeCard challenge={mockSelectedChallenge} />).getByText("Selected")).toBeTruthy();
    expect(renderWithProviders(<ChallengeCard challenge={mockCompletedChallenge} />).getByText("Completed")).toBeTruthy();
    expect(renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} />).getByText("Locked")).toBeTruthy();
  });

  it("renders the locked icon", () => {
    const { getByTestId } = renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} />);
    expect(getByTestId("icon-lock-closed")).toBeTruthy();
  });

  it("calls onPress when unlocked", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeCard challenge={mockChallenge} onPress={onPress} />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledWith(mockChallenge);
  });

  it("does not call onPress when locked", () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeCard challenge={mockLockedChallenge} onPress={onPress} />);
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders tall layout extras", () => {
    const { getByText } = renderWithProviders(<ChallengeCard challenge={mockTallChallenge} />);
    expect(getByText("+2")).toBeTruthy();
  });
});
