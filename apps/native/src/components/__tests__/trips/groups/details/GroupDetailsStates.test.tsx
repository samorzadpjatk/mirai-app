import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../../helpers/renderWithProviders";
import { GroupDetailsLoadingState } from "../../../../trips/groups/details/GroupDetailsLoadingState";
import { GroupNotFoundState } from "../../../../trips/groups/details/GroupNotFoundState";

describe("GroupDetailsLoadingState", () => {
  it("renders loading indicator", () => {
    renderWithProviders(<GroupDetailsLoadingState />);

    expect(screen.getByTestId("group-details-loading-indicator")).toBeOnTheScreen();
  });
});

describe("GroupNotFoundState", () => {
  it("renders not found message", () => {
    renderWithProviders(<GroupNotFoundState onGoBack={jest.fn()} />);

    expect(screen.getByText("Group not found")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupNotFoundState onGoBack={onGoBack} />);

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});
