import React from "react";
import { ActivityIndicator, View } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsLoadingState } from "../../../trips/groups/GroupsLoadingState";

describe("GroupsLoadingState", () => {
  it("should render container", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have centered layout styling", () => {
    renderWithProviders(<GroupsLoadingState />);
    const view = screen.UNSAFE_getByType(View);
    expect(view.props.style).toBeTruthy();
  });
});
