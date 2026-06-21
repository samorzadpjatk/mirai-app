import { screen } from "@testing-library/react-native";
import LoadingScreen from "../LoadingScreen";
import { renderWithProviders } from "./helpers/renderWithProviders";

describe("LoadingScreen", () => {
  it("renders with default loading message", () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders with custom message", () => {
    renderWithProviders(<LoadingScreen message="Please wait..." />);

    expect(screen.getByText("Please wait...")).toBeTruthy();
  });

  it("renders skeleton", () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByTestId("loading-screen-skeleton")).toBeTruthy();
  });

  it("uses default message when no message prop provided", () => {
    renderWithProviders(<LoadingScreen />);

    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders with long message", () => {
    const longMessage =
      "This is a very long loading message that describes what is happening in detail";
    renderWithProviders(<LoadingScreen message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeTruthy();
  });
});
