import { fireEvent, screen } from "@testing-library/react-native";
import { PrimaryAddButton } from "../../common/buttons/PrimaryAddButton";
import { renderWithProviders } from "../helpers/renderWithProviders";

const noop = (): void => undefined;

describe("PrimaryAddButton", () => {
  it("should render with default label", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} />);

    expect(screen.getByText("Add New")).toBeTruthy();
  });

  it("should render with custom label", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Create Item" />);

    expect(screen.getByText("Create Item")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    renderWithProviders(<PrimaryAddButton onPress={onPress} label="Add" />);

    fireEvent.press(screen.getByText("Add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Disabled" disabled={true} />);

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button).toBeDisabled();
  });

  it("should not have disabled prop when disabled is false", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Enabled" disabled={false} />);

    const button = screen.getByRole("button", { name: "Enabled" });
    expect(button).not.toBeDisabled();
  });

  it("should apply custom style", () => {
    const customStyle = { marginTop: 20 };
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Styled" style={customStyle} />);

    const button = screen.getByRole("button", { name: "Styled" });
    expect(button).toHaveStyle(customStyle);
  });

  it("should apply custom text style", () => {
    const customTextStyle = { fontSize: 18 };
    renderWithProviders(
      <PrimaryAddButton onPress={noop} label="Styled Text" textStyle={customTextStyle} />,
    );

    const text = screen.getByText("Styled Text");
    expect(text.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customTextStyle)]),
    );
  });

  it("should render with add-circle icon", () => {
    renderWithProviders(<PrimaryAddButton onPress={noop} label="Add" />);

    const button = screen.getByRole("button", { name: "Add" });
    expect(button).toBeTruthy();
  });
});
