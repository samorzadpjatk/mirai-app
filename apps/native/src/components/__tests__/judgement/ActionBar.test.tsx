import React from "react";
import { TouchableOpacity } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ActionBar } from "../../judgement/ActionBar";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe("ActionBar", () => {
  const mockOnReject = jest.fn();
  const mockOnApprove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getButtons = (screen: ReturnType<typeof renderWithProviders>) => screen.UNSAFE_getAllByType(TouchableOpacity);

  it("should render reject button", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(screen.getByText("close")).toBeTruthy();
  });

  it("should render approve button", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(screen.getByText("checkmark")).toBeTruthy();
  });

  it("should render swipe hint", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(screen.getByText("Swipe to decide")).toBeTruthy();
  });

  it("should render swap horizontal icon", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(screen.getByText("swap-horizontal")).toBeTruthy();
  });

  it("should call onReject when reject button is pressed", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    fireEvent.press(getButtons(screen)[0]);
    expect(mockOnReject).toHaveBeenCalledTimes(1);
  });

  it("should call onApprove when approve button is pressed", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    fireEvent.press(getButtons(screen)[1]);
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it("should disable buttons when disabled prop is true", () => {
    const screen = renderWithProviders(<ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />);
    const buttons = getButtons(screen);
    expect(buttons[0].props.disabled).toBe(true);
    expect(buttons[1].props.disabled).toBe(true);
  });

  it("should enable buttons when disabled prop is false", () => {
    const screen = renderWithProviders(<ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />);
    const buttons = getButtons(screen);
    expect(buttons[0].props.disabled).toBe(false);
    expect(buttons[1].props.disabled).toBe(false);
  });

  it("should not call onReject when disabled", () => {
    const screen = renderWithProviders(<ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(getButtons(screen)[0].props.disabled).toBe(true);
  });

  it("should not call onApprove when disabled", () => {
    const screen = renderWithProviders(<ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />);
    expect(getButtons(screen)[1].props.disabled).toBe(true);
  });
});
