import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupsNoTripState } from "../../../trips/groups/GroupsNoTripState";
import { GroupCreateNoTripState } from "../../../trips/groups/create/GroupCreateNoTripState";
import { GroupsCreateButton } from "../../../trips/groups/GroupsCreateButton";

describe("GroupsNoTripState", () => {
  it("renders no trip message", () => {
    renderWithProviders(<GroupsNoTripState onGoBack={jest.fn()} />);

    expect(screen.getByText("No trip selected")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupsNoTripState onGoBack={onGoBack} />);

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});

describe("GroupCreateNoTripState", () => {
  it("renders no trip message", () => {
    renderWithProviders(<GroupCreateNoTripState onGoBack={jest.fn()} />);

    expect(screen.getByText("No trip selected")).toBeOnTheScreen();
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("calls onGoBack when go back is pressed", async () => {
    const onGoBack = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupCreateNoTripState onGoBack={onGoBack} />);

    await user.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalled();
  });
});

describe("GroupsCreateButton", () => {
  it("renders add button", () => {
    renderWithProviders(<GroupsCreateButton onPress={jest.fn()} />);

    expect(screen.getByText("Add New")).toBeOnTheScreen();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<GroupsCreateButton onPress={onPress} />);

    await user.press(screen.getByText("Add New"));
    expect(onPress).toHaveBeenCalled();
  });
});
