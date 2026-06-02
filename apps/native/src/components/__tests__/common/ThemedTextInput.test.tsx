import { TextInput, type TextInputProps } from "react-native";
import { screen, userEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ThemedTextInput } from "../../common/ui/ThemedTextInput";

interface TextInputStyle {
  borderColor?: string;
}

describe("ThemedTextInput", () => {
  it("should render with placeholder", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeOnTheScreen();
  });

  it("should render with value", () => {
    renderWithProviders(<ThemedTextInput value="Test value" />);

    const input = screen.getByDisplayValue("Test value");
    expect(input).toBeOnTheScreen();
  });

  it("should apply error style when error is true", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" error={true} />);

    const input = screen.getByPlaceholderText("Enter text");
    const inputProps = input.props as TextInputProps;
    const inputStyle = inputProps.style as TextInputStyle[];
    expect(inputStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: expect.any(String) as string }),
      ]),
    );
  });

  it("should not apply error style when error is false", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" error={false} />);

    const input = screen.getByPlaceholderText("Enter text");
    const styles = input.props.style as TextInputStyle[];
    const hasErrorBorder = styles.some((s: TextInputStyle) => s?.borderColor === "danger");
    expect(hasErrorBorder).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { fontSize: 20 };
    renderWithProviders(<ThemedTextInput placeholder="Enter text" style={customStyle} />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)]),
    );
  });

  it("should call onChangeText when text changes", async () => {
    const onChangeText = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<ThemedTextInput placeholder="Enter text" onChangeText={onChangeText} />);

    const input = screen.getByPlaceholderText("Enter text");
    await user.type(input, "new text");
    expect(onChangeText).toHaveBeenCalledWith("new text");
  });

  it("should apply placeholderTextColor", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.placeholderTextColor).toBeDefined();
  });

  it("should pass through additional TextInput props", () => {
    renderWithProviders(
      <ThemedTextInput
        placeholder="Enter text"
        keyboardType="email-address"
        autoCapitalize="none"
        secureTextEntry={true}
        maxLength={50}
      />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.keyboardType).toBe("email-address");
    expect(input.props.autoCapitalize).toBe("none");
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.maxLength).toBe(50);
  });

  it("should handle multiline prop", () => {
    renderWithProviders(
      <ThemedTextInput placeholder="Enter text" multiline={true} numberOfLines={4} />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(4);
  });

  it("should handle editable prop", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" editable={false} />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.editable).toBe(false);
  });

  it("should handle autoFocus prop", () => {
    renderWithProviders(<ThemedTextInput placeholder="Enter text" autoFocus={true} />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input.props.autoFocus).toBe(true);
  });
});
