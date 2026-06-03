import { fireEvent } from "@testing-library/react-native";
import { ActionBar } from "../../judgement/ActionBar";
import { renderWithProviders } from "../helpers/renderWithProviders";

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

  it("should render reject button", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByText("close")).toBeTruthy();
  });

  it("should render approve button", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByText("checkmark")).toBeTruthy();
  });

  it("should render swipe hint", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByText("Swipe to decide")).toBeTruthy();
  });

  it("should render swap horizontal icon", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByText("swap-horizontal")).toBeTruthy();
  });

  it("should call onReject when reject button is pressed", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    fireEvent.press(screen.getByTestId("reject-button"));
    expect(mockOnReject).toHaveBeenCalledTimes(1);
  });

  it("should call onApprove when approve button is pressed", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    fireEvent.press(screen.getByTestId("approve-button"));
    expect(mockOnApprove).toHaveBeenCalledTimes(1);
  });

  it("should disable buttons when disabled prop is true", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByTestId("reject-button")).toBeDisabled();
    expect(screen.getByTestId("approve-button")).toBeDisabled();
  });

  it("should enable buttons when disabled prop is false", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={false} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByTestId("reject-button")).not.toBeDisabled();
    expect(screen.getByTestId("approve-button")).not.toBeDisabled();
  });

  it("should not call onReject when disabled", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByTestId("reject-button")).toBeDisabled();
  });

  it("should not call onApprove when disabled", () => {
    const screen = renderWithProviders(
      <ActionBar disabled={true} onReject={mockOnReject} onApprove={mockOnApprove} />,
    );
    expect(screen.getByTestId("approve-button")).toBeDisabled();
  });
});
