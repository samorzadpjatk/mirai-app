import React from "react";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { GroupEditLoadingState } from "../../../../trips/groups/edit/GroupEditLoadingState";
import { GroupEditNoTripState } from "../../../../trips/groups/edit/GroupEditNoTripState";
import { GroupEditNotFoundState } from "../../../../trips/groups/edit/GroupEditNotFoundState";
import { GroupEditPermissionState } from "../../../../trips/groups/edit/GroupEditPermissionState";

describe("GroupEditLoadingState", () => {
  it("renders loading indicator", () => {
    renderWithProviders(<GroupEditLoadingState />);

    expect(screen.getByTestId("group-edit-loading-indicator")).toBeOnTheScreen();
  });
});

describe("GroupEditNoTripState", () => {
  it("renders no trip message", () => {
    renderWithProviders(<GroupEditNoTripState onGoBack={jest.fn()} />);

    expect(screen.getByText("No group selected")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupEditNoTripState onGoBack={onGoBack} />);

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});

describe("GroupEditNotFoundState", () => {
  it("renders not found message", () => {
    renderWithProviders(<GroupEditNotFoundState onGoBack={jest.fn()} />);

    expect(screen.getByText("Group not found")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupEditNotFoundState onGoBack={onGoBack} />);

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});

describe("GroupEditPermissionState", () => {
  it("renders permission message", () => {
    renderWithProviders(
      <GroupEditPermissionState message="You don't have permission" onGoBack={jest.fn()} />,
    );

    expect(screen.getByText("You don't have permission")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <GroupEditPermissionState message="Access denied" onGoBack={onGoBack} />,
    );

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});
