import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AlertsHeader } from "../../alerts/AlertsHeader";

describe("AlertsHeader", () => {
  it("should render title and subtitle", () => {
    renderWithProviders(<AlertsHeader title="Notifications" subtitle="View your alerts" />);

    expect(screen.getByText("Notifications")).toBeOnTheScreen();
    expect(screen.getByText("View your alerts")).toBeOnTheScreen();
  });

  it("should render different copy", () => {
    renderWithProviders(<AlertsHeader title="Alert Center" subtitle="Manage your notifications" />);

    expect(screen.getByText("Alert Center")).toBeOnTheScreen();
    expect(screen.getByText("Manage your notifications")).toBeOnTheScreen();
  });
});
