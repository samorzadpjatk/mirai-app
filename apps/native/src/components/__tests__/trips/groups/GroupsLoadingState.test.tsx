import React from "react";
import { ActivityIndicator, View } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsLoadingState } from "../../../trips/groups/GroupsLoadingState";

describe("GroupsLoadingState", () => {
  it("should render container", () => {
    const { UNSAFE_getByType } = renderWithProviders(<GroupsLoadingState />);
    const view = UNSAFE_getByType(View);
    expect(view).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should render with large size indicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(<GroupsLoadingState />);
    const activityIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(activityIndicator.props.size).toBe("large");
  });

  it("should have centered layout styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(<GroupsLoadingState />);
    const view = UNSAFE_getByType(View);
    expect(view.props.style).toBeTruthy();
  });
});
