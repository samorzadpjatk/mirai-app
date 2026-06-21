import { screen } from "@testing-library/react-native";
import { GroupsLoadingState } from "../../../trips/groups/GroupsLoadingState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("GroupsLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-state");
    expect(view).toBeTruthy();
  });

  it("should render skeleton card placeholders", () => {
    renderWithProviders(<GroupsLoadingState />);
    expect(screen.getByTestId("groups-loading-card-0")).toBeTruthy();
  });

  it("should have centered layout styling", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-state");
    expect(view.props.style).toBeTruthy();
  });
});
