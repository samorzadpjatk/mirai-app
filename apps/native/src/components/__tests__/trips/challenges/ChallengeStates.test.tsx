import { screen, userEvent } from "@testing-library/react-native";
import { GroupInfoCard } from "../../../trips/challenges/GroupInfoCard";
import { TripNotFoundState } from "../../../trips/challenges/TripNotFoundState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe("TripNotFoundState", () => {
  it("renders default message", () => {
    renderWithProviders(<TripNotFoundState />);

    expect(screen.getByText("Trip not found")).toBeOnTheScreen();
  });

  it("renders custom message", () => {
    renderWithProviders(<TripNotFoundState message="Custom error" />);

    expect(screen.getByText("Custom error")).toBeOnTheScreen();
  });
});

describe("GroupInfoCard", () => {
  it("renders group name and position", () => {
    renderWithProviders(
      <GroupInfoCard
        groupName="Team Alpha"
        position={2}
        totalGroups={5}
        pointsDifference={15}
        targetPosition={1}
        targetGroupName="Team Beta"
        completedChallengesCount={3}
        totalChallengesCount={10}
      />,
    );

    expect(screen.getByText("Team Alpha")).toBeOnTheScreen();
    expect(screen.getByText("#2 / 5")).toBeOnTheScreen();
    expect(screen.getByText("15 pts")).toBeOnTheScreen();
    expect(screen.getByText("Brakuje 15 pkt do #1 Team Beta")).toBeOnTheScreen();
    expect(screen.getByText("3")).toBeOnTheScreen();
    expect(screen.getByText("/ 10")).toBeOnTheScreen();
  });

  it("renders leading position with green styling", () => {
    renderWithProviders(
      <GroupInfoCard
        groupName="Team Alpha"
        position={1}
        totalGroups={5}
        pointsDifference={20}
        targetPosition={2}
        targetGroupName="Team Beta"
        completedChallengesCount={8}
        totalChallengesCount={10}
      />,
    );

    expect(screen.getByText("Przewaga 20 pkt nad #2 Team Beta")).toBeOnTheScreen();
    expect(screen.getByText("20 pts")).toBeOnTheScreen();
  });

  it("handles missing optional props", () => {
    renderWithProviders(<GroupInfoCard groupName="Team Alpha" />);

    expect(screen.getByText("Team Alpha")).toBeOnTheScreen();
    expect(screen.getByText("#- / 0")).toBeOnTheScreen();
    expect(screen.getByText("0 pts")).toBeOnTheScreen();
    expect(screen.getByText("Brakuje do wyższej pozycji")).toBeOnTheScreen();
  });
});
