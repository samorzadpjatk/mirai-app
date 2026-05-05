import React from "react";
import { Image } from "react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeDescriptionCard } from "../../../trips/challenges/ChallengeDescriptionCard";

describe("ChallengeDescriptionCard", () => {
  it("renders the provided description", () => {
    const description = "This is a test challenge description";
    const { getByText } = renderWithProviders(<ChallengeDescriptionCard description={description} />);
    expect(getByText(description)).toBeTruthy();
  });

  it("renders the default description when none is provided", () => {
    const { getByText } = renderWithProviders(<ChallengeDescriptionCard description={null} />);
    expect(getByText("Complete this challenge to earn points for your group!")).toBeTruthy();
  });

  it("renders an image when imageUrl is provided", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ChallengeDescriptionCard description="Test description" imageUrl="https://example.com/image.jpg" />);
    const image = UNSAFE_getByType(Image);
    expect(image.props.source.uri).toBe("https://example.com/image.jpg");
  });

  it("does not render an image when imageUrl is missing", () => {
    const { UNSAFE_queryByType } = renderWithProviders(<ChallengeDescriptionCard description="Test description" />);
    expect(UNSAFE_queryByType(Image)).toBeNull();
  });

  it("keeps an empty string description empty", () => {
    const { queryByText } = renderWithProviders(<ChallengeDescriptionCard description="" />);
    expect(queryByText("Complete this challenge to earn points for your group!")).toBeNull();
  });
});
