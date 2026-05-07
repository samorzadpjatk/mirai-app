import React from "react";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsLoadingState } from "../../../trips/groups/GroupsLoadingState";

describe("GroupsLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-container");
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = screen.getByTestId("groups-loading-indicator");
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = screen.getByTestId("groups-loading-indicator");
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have centered layout styling", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.getByTestId("groups-loading-container");
    expect(view.props.style).toBeTruthy();
  });
});
