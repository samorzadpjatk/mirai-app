import React from "react";

import { render, fireEvent, screen } from "@testing-library/react-native";
import { TamaguiProvider } from "tamagui";
import { ThemeSwitcher } from "~/components/ThemeSwitcher";
import tamaguiConfig from "tamagui.config";

const wrapWithProvider = (ui: React.ReactElement) => (
  <TamaguiProvider config={tamaguiConfig}>{ui}</TamaguiProvider>
);

const renderWithProvider = (ui: React.ReactElement) => render(wrapWithProvider(ui));

describe("ThemeSwitcher", () => {
  it("renders correctly with light theme", () => {
    const mockOnToggle = jest.fn();
    renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="light" />,
    );

    expect(screen.getByLabelText("Toggle theme")).toBeTruthy();
    expect(screen.getByText("Light Mode")).toBeTruthy();
  });

  it("renders correctly with dark theme", () => {
    const mockOnToggle = jest.fn();
    renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="dark" />,
    );

    expect(screen.getByLabelText("Toggle theme")).toBeTruthy();
    expect(screen.getByText("Dark Mode")).toBeTruthy();
  });

  it("calls onToggle when button is pressed", () => {
    const mockOnToggle = jest.fn();
    renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="light" />,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const button = screen.getByLabelText("Toggle theme");
    fireEvent.press(button);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("displays correct text for light theme", () => {
    const mockOnToggle = jest.fn();
    renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="light" />,
    );

    expect(screen.getByText("Light Mode")).toBeTruthy();
  });

  it("displays correct text for dark theme", () => {
    const mockOnToggle = jest.fn();
    renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="dark" />,
    );

    expect(screen.getByText("Dark Mode")).toBeTruthy();
  });

  it("updates when currentTheme prop changes", () => {
    const mockOnToggle = jest.fn();
    const { rerender } = renderWithProvider(
      <ThemeSwitcher onToggle={mockOnToggle} currentTheme="light" />,
    );

    expect(screen.getByText("Light Mode")).toBeTruthy();

    rerender(
      wrapWithProvider(
        <ThemeSwitcher onToggle={mockOnToggle} currentTheme="dark" />,
      ),
    );

    expect(screen.getByText("Dark Mode")).toBeTruthy();
  });
});
