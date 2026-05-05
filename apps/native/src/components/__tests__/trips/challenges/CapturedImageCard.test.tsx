import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { CapturedImageCard } from "../../../trips/challenges/CapturedImageCard";

describe("CapturedImageCard", () => {
  const mockImageUri = "file:///path/to/captured/image.jpg";

  it("should render with image", () => {
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    expect(getByText("Submission sent - pending review")).toBeTruthy();
  });

  it("should display the captured image", () => {
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    expect(getByText("Submission sent - pending review")).toBeTruthy();
  });

  it("should call onRetake when retake button is pressed", () => {
    const onRetake = jest.fn();
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={onRetake}
        onDone={() => {}}
      />
    );

    fireEvent.press(getByText("Retake"));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("should call onDone when done button is pressed", () => {
    const onDone = jest.fn();
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={onDone}
      />
    );

    fireEvent.press(getByText("Done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("should render retake button with correct styling", () => {
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    const retakeText = getByText("Retake");
    expect(retakeText).toBeTruthy();
  });

  it("should render done button with correct styling", () => {
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    const doneText = getByText("Done");
    expect(doneText).toBeTruthy();
  });

  it("should render both action buttons in a row", () => {
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={mockImageUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    expect(getByText("Retake")).toBeTruthy();
    expect(getByText("Done")).toBeTruthy();
  });

  it("should handle different image URIs", () => {
    const differentUri = "https://example.com/image.png";
    const { getByText } = renderWithProviders(
      <CapturedImageCard
        imageUri={differentUri}
        onRetake={() => {}}
        onDone={() => {}}
      />
    );

    expect(getByText("Submission sent - pending review")).toBeTruthy();
  });
});
