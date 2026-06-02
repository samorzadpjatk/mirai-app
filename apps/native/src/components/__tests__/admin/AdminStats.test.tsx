import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AdminStats from "../../admin/AdminStats";

describe("AdminStats", () => {
  it("renders with stats", () => {
    renderWithProviders(<AdminStats stats={{ activeChallenges: 5, wintegralChallenges: 3 }} />);

    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("Wintegral")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("renders with zero stats", () => {
    renderWithProviders(<AdminStats stats={{ activeChallenges: 0, wintegralChallenges: 0 }} />);

    expect(screen.getAllByText("Active")).toBeTruthy();
    const zeroValues = screen.getAllByText("0");
    expect(zeroValues.length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Wintegral")).toBeTruthy();
  });

  it("renders with large numbers", () => {
    renderWithProviders(<AdminStats stats={{ activeChallenges: 999, wintegralChallenges: 888 }} />);

    expect(screen.getByText("999")).toBeTruthy();
    expect(screen.getByText("888")).toBeTruthy();
  });

  it("displays correct labels", () => {
    renderWithProviders(<AdminStats stats={{ activeChallenges: 10, wintegralChallenges: 5 }} />);

    const activeLabel = screen.getByText("Active");
    const wintegralLabel = screen.getByText("Wintegral");

    expect(activeLabel).toBeTruthy();
    expect(wintegralLabel).toBeTruthy();
  });
});
