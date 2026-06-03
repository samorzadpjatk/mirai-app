import { fireEvent, screen } from "@testing-library/react-native";
import { ChallengeNotFoundState } from "../../../trips/challenges/ChallengeNotFoundState";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengeNotFoundState", () => {
  it("should render title", () => {
    renderWithProviders(<ChallengeNotFoundState onGoBack={jest.fn()} />);
    expect(screen.getByText("Challenge not found")).toBeOnTheScreen();
  });

  it("should render go back button", () => {
    renderWithProviders(<ChallengeNotFoundState onGoBack={jest.fn()} />);
    expect(screen.getByText("Go Back")).toBeOnTheScreen();
  });

  it("should call onGoBack when button is pressed", () => {
    const onGoBack = jest.fn();
    renderWithProviders(<ChallengeNotFoundState onGoBack={onGoBack} />);
    fireEvent.press(screen.getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it("should render with centered layout", () => {
    renderWithProviders(<ChallengeNotFoundState onGoBack={jest.fn()} />);
    const container = screen.getByTestId("challenge-not-found-container");
    expect(container).toBeOnTheScreen();
  });

  it("should render button with correct styling", () => {
    renderWithProviders(<ChallengeNotFoundState onGoBack={jest.fn()} />);
    const button = screen.getByText("Go Back");
    expect(button).toBeOnTheScreen();
  });
});
