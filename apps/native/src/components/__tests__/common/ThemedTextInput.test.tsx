import React from "react";
import { TextInput } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ThemedTextInput } from "../../common/ui/ThemedTextInput";

describe("ThemedTextInput", () => {
  it("should render with placeholder", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholder).toBe("Enter text");
  });

  it("should render with value", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput value="Test value" />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe("Test value");
  });

  it("should apply error style when error is true", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" error={true} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: expect.any(String) }),
      ])
    );
  });

  it("should not apply error style when error is false", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" error={false} />
    );

    const input = UNSAFE_getByType(TextInput);
    const styles = input.props.style;
    const hasErrorBorder = styles.some(
      (s: Record<string, string>) => s?.borderColor === "danger"
    );
    expect(hasErrorBorder).toBe(false);
  });

  it("should apply custom style", () => {
    const customStyle = { fontSize: 20 };
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" style={customStyle} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining(customStyle)])
    );
  });

  it("should call onChangeText when text changes", () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" onChangeText={onChangeText} />
    );

    const input = UNSAFE_getByType(TextInput);
    input.props.onChangeText("new text");
    expect(onChangeText).toHaveBeenCalledWith("new text");
  });

  it("should apply placeholderTextColor", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.placeholderTextColor).toBeDefined();
  });

  it("should pass through additional TextInput props", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput
        placeholder="Enter text"
        keyboardType="email-address"
        autoCapitalize="none"
        secureTextEntry={true}
        maxLength={50}
      />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.keyboardType).toBe("email-address");
    expect(input.props.autoCapitalize).toBe("none");
    expect(input.props.secureTextEntry).toBe(true);
    expect(input.props.maxLength).toBe(50);
  });

  it("should handle multiline prop", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" multiline={true} numberOfLines={4} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.multiline).toBe(true);
    expect(input.props.numberOfLines).toBe(4);
  });

  it("should handle editable prop", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" editable={false} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.editable).toBe(false);
  });

  it("should handle autoFocus prop", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ThemedTextInput placeholder="Enter text" autoFocus={true} />
    );

    const input = UNSAFE_getByType(TextInput);
    expect(input.props.autoFocus).toBe(true);
  });
});
