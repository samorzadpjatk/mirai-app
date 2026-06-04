import { screen } from "@testing-library/react-native";
import { ChallengeDescriptionCard } from "../../../trips/challenges/ChallengeDescriptionCard";
import { renderWithProviders } from "../../helpers/renderWithProviders";

describe("ChallengeDescriptionCard", () => {
  it("renders the provided description", () => {
    const description = "This is a test challenge description";
    renderWithProviders(<ChallengeDescriptionCard description={description} />);
    expect(screen.getByText(description)).toBeOnTheScreen();
  });

  it("renders the default description when none is provided", () => {
    renderWithProviders(<ChallengeDescriptionCard description={null} />);
    expect(
      screen.getByText("Complete this challenge to earn points for your group!"),
    ).toBeOnTheScreen();
  });

  it("renders an image when imageUrl is provided", () => {
    renderWithProviders(
      <ChallengeDescriptionCard
        description="Test description"
        imageUrl="https://example.com/image.jpg"
      />,
    );
    const image = screen.getByTestId("challenge-image");
    expect(image).toBeOnTheScreen();
    expect(image.props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("does not render an image when imageUrl is missing", () => {
    renderWithProviders(<ChallengeDescriptionCard description="Test description" />);
    expect(screen.queryByTestId("challenge-image")).toBeNull();
  });

  it("keeps an empty string description empty", () => {
    const { queryByText } = renderWithProviders(<ChallengeDescriptionCard description="" />);
    expect(queryByText("Complete this challenge to earn points for your group!")).toBeNull();
  });
});
