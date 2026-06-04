import { screen, userEvent } from "@testing-library/react-native";
import { FloatingActionButton } from "../../common/FloatingActionButton";
import { renderWithProviders } from "../helpers/renderWithProviders";

const noop = (): void => undefined;

describe("FloatingActionButton", () => {
  it("should render with icon", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add item"
        testID="fab-button"
      />,
    );

    expect(screen.getByTestId("fab-button")).toBeOnTheScreen();
  });

  it("should call onPress when pressed", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <FloatingActionButton
        onPress={onPress}
        iconName="add"
        accessibilityLabel="Add"
        testID="fab-button"
      />,
    );

    await user.press(screen.getByTestId("fab-button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should have disabled prop when disabled is true", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        disabled={true}
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button).toBeDisabled();
  });

  it("should not have disabled prop when disabled is false", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        disabled={false}
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button).not.toBeDisabled();
  });

  it("should apply custom style", () => {
    const customStyle = { bottom: 100, right: 20 };
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        style={customStyle}
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button).toHaveStyle(customStyle);
  });

  it("should render icon with custom size", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        iconSize={48}
        testID="fab-button"
      />,
    );

    expect(screen.getByTestId("fab-button")).toBeOnTheScreen();
  });

  it("should render icon with default size", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        testID="fab-button"
      />,
    );

    expect(screen.getByTestId("fab-button")).toBeOnTheScreen();
  });

  it("should use custom activeOpacity", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        activeOpacity={0.5}
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button).toBeOnTheScreen();
  });

  it("should use default activeOpacity when not specified", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add"
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button).toBeOnTheScreen();
  });

  it("should have correct accessibility role and label", () => {
    renderWithProviders(
      <FloatingActionButton
        onPress={noop}
        iconName="add"
        accessibilityLabel="Add new item"
        testID="fab-button"
      />,
    );

    const button = screen.getByTestId("fab-button");
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityLabel).toBe("Add new item");
  });
});
