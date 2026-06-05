import { screen, userEvent } from "@testing-library/react-native";
import { ErrorState } from "../../../common/ui/ErrorState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ErrorState", () => {
  it("renders with default title and message", () => {
    renderWithProviders(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeOnTheScreen();
    expect(screen.getByText("We couldn't load this content. Please try again.")).toBeOnTheScreen();
  });

  it("renders with custom title and message", () => {
    renderWithProviders(<ErrorState title="Custom Error" message="Custom message" />);
    expect(screen.getByText("Custom Error")).toBeOnTheScreen();
    expect(screen.getByText("Custom message")).toBeOnTheScreen();
  });

  it("renders container with testID", () => {
    renderWithProviders(<ErrorState />);
    expect(screen.getByTestId("error-state-container")).toBeOnTheScreen();
  });

  it("does not render retry button when onRetry is not provided", () => {
    renderWithProviders(<ErrorState />);
    expect(screen.queryByTestId("error-state-retry")).not.toBeOnTheScreen();
  });

  it("renders retry button when onRetry is provided", () => {
    renderWithProviders(<ErrorState onRetry={jest.fn()} />);
    expect(screen.getByTestId("error-state-retry")).toBeOnTheScreen();
    expect(screen.getByText("Retry")).toBeOnTheScreen();
  });

  it("renders custom retry label", () => {
    renderWithProviders(<ErrorState onRetry={jest.fn()} retryLabel="Try Again" />);
    expect(screen.getByText("Try Again")).toBeOnTheScreen();
  });

  it("calls onRetry when retry button is pressed", async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(<ErrorState onRetry={onRetry} />);
    await user.press(screen.getByTestId("error-state-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
