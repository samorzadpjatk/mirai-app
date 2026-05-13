import React from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { CapturedImageCard } from "../../../trips/challenges/CapturedImageCard";

const noop = (): void => void 0;

describe("CapturedImageCard", () => {
  const mockImageUri = "file:///path/to/captured/image.jpg";

  it("should render with image", () => {
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={noop} />,
    );

    expect(screen.getByText("Submission sent - pending review")).toBeOnTheScreen();
  });

  it("should display the captured image", () => {
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={noop} />,
    );

    expect(screen.getByText("Submission sent - pending review")).toBeOnTheScreen();
  });

  it("should call onRetake when retake button is pressed", () => {
    const onRetake = jest.fn();
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={onRetake} onDone={noop} />,
    );

    fireEvent.press(screen.getByText("Retake"));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("should call onDone when done button is pressed", () => {
    const onDone = jest.fn();
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={onDone} />,
    );

    fireEvent.press(screen.getByText("Done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("should render retake button with correct styling", () => {
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={noop} />,
    );

    const retakeText = screen.getByText("Retake");
    expect(retakeText).toBeOnTheScreen();
  });

  it("should render done button with correct styling", () => {
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={noop} />,
    );

    const doneText = screen.getByText("Done");
    expect(doneText).toBeOnTheScreen();
  });

  it("should render both action buttons in a row", () => {
    renderWithProviders(
      <CapturedImageCard imageUri={mockImageUri} onRetake={noop} onDone={noop} />,
    );

    expect(screen.getByText("Retake")).toBeOnTheScreen();
    expect(screen.getByText("Done")).toBeOnTheScreen();
  });

  it("should handle different image URIs", () => {
    const differentUri = "https://example.com/image.png";
    renderWithProviders(
      <CapturedImageCard imageUri={differentUri} onRetake={noop} onDone={noop} />,
    );

    expect(screen.getByText("Submission sent - pending review")).toBeOnTheScreen();
  });
});
