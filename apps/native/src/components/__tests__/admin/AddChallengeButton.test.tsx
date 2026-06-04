import { fireEvent } from "@testing-library/react-native";
import { AddChallengeButton } from "../../admin/challenges/AddChallengeButton";
import { renderWithProviders } from "../helpers/renderWithProviders";

describe("AddChallengeButton", () => {
  it("renders with the default label", () => {
    const { getByText } = renderWithProviders(<AddChallengeButton onPress={jest.fn()} />);

    expect(getByText("Add New")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProviders(<AddChallengeButton onPress={onPress} />);

    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalled();
  });
});
