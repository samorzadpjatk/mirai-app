import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupStatsGrid } from "../../../trips/groups/details/GroupStatsGrid";

describe("GroupStatsGrid", () => {
  it("renders all stat labels", () => {
    renderWithProviders(<GroupStatsGrid membersCount={5} coins={100} />);
    expect(screen.getByText("Members")).toBeOnTheScreen();
    expect(screen.getByText("Coins")).toBeOnTheScreen();
    expect(screen.getByText("Position")).toBeOnTheScreen();
  });

  it("formats values correctly", () => {
    renderWithProviders(<GroupStatsGrid membersCount={5} coins={1000} rankingPosition={3} />);
    expect(screen.getByText("5")).toBeOnTheScreen();
    expect(screen.getByText("1,000")).toBeOnTheScreen();
    expect(screen.getByText("#3")).toBeOnTheScreen();
  });

  it("shows a placeholder when ranking is missing", () => {
    renderWithProviders(<GroupStatsGrid membersCount={5} coins={100} />);
    expect(screen.getByText("--")).toBeOnTheScreen();
  });
});
