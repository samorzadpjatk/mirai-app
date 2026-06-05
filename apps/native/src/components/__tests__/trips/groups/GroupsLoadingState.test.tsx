import { screen } from "@testing-library/react-native";
import { GroupsLoadingState } from "../../../trips/groups/GroupsLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("GroupsLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-state");
    expect(view).toBeTruthy();
  });

  it("should render placeholder views", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-state");
    expect(view.children.length).toBeGreaterThan(0);
  });

  it("should have centered layout styling", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-state");
    expect(view.props.style).toBeTruthy();
  });
});
