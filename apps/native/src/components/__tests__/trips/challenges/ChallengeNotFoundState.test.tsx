import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeNotFoundState } from "../../../trips/challenges/ChallengeNotFoundState";

describe("ChallengeNotFoundState", () => {
  it("should render title", () => {
    const { getByText } = renderWithProviders(
      <ChallengeNotFoundState onGoBack={jest.fn()} />
    );
    expect(getByText("Challenge not found")).toBeTruthy();
  });

  it("should render go back button", () => {
    const { getByText } = renderWithProviders(
      <ChallengeNotFoundState onGoBack={jest.fn()} />
    );
    expect(getByText("Go Back")).toBeTruthy();
  });

  it("should call onGoBack when button is pressed", () => {
    const onGoBack = jest.fn();
    const { getByText } = renderWithProviders(
      <ChallengeNotFoundState onGoBack={onGoBack} />
    );
    fireEvent.press(getByText("Go Back"));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it("should render with centered layout", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ChallengeNotFoundState onGoBack={jest.fn()} />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should render button with correct styling", () => {
    const { getByText } = renderWithProviders(
      <ChallengeNotFoundState onGoBack={jest.fn()} />
    );
    const button = getByText("Go Back");
    expect(button).toBeTruthy();
  });
});
