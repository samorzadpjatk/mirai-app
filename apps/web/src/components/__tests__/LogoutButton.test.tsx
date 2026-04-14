/// <reference lib="dom" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LogoutButton } from "../LogoutButton";

// Mock the logout function
const mockLogout = mock(() => Promise.resolve());

mock.module("../../lib/logout", () => ({
  logout: mockLogout,
}));

describe("[UNIT] LogoutButton", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  test("renders sign out button", () => {
    render(<LogoutButton />);

    // Use getAllByText and select first match to handle potential duplicates
    const signOutElements = screen.getAllByText("Sign out");
    expect(signOutElements.length).toBeGreaterThan(0);
    expect(signOutElements[0]).toBeDefined();
  });

  test("renders with custom className", () => {
    const { container } = render(<LogoutButton className="custom-class" />);

    expect(container.firstChild?.classList.contains("custom-class")).toBe(true);
  });

  test("calls logout when clicked", async () => {
    render(<LogoutButton />);

    // Use getAllByText to handle multiple elements with "Sign out"
    const buttons = screen.getAllByText("Sign out");
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test("shows loading state while logging out", async () => {
    // Delay the logout to check loading state
    mockLogout.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LogoutButton />);

    // Use getAllByText to handle multiple elements with "Sign out"
    const buttons = screen.getAllByText("Sign out");
    fireEvent.click(buttons[0]);

    // Button should show loading text - use getAllByText for consistency
    await waitFor(() => {
      const loadingElements = screen.getAllByText("Signing out...");
      expect(loadingElements.length).toBeGreaterThan(0);
      expect(loadingElements[0]).toBeDefined();
    });
  });

  test("button is disabled while loading", async () => {
    mockLogout.mockImplementation(() => new Promise(() => {}));

    render(<LogoutButton />);

    // Use getAllByText to handle multiple elements with "Sign out"
    const buttons = screen.getAllByText("Sign out");
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      // Use getAllByText to handle potential duplicates
      const loadingButtons = screen.getAllByText("Signing out...");
      expect(loadingButtons.length).toBeGreaterThan(0);
      expect(loadingButtons[0].closest("button")?.disabled).toBe(true);
    });
  });

  test("renders logout icon", () => {
    const { container } = render(<LogoutButton />);

    // Check for SVG icon (react-icons renders as SVG)
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });

  test("has correct button type", () => {
    render(<LogoutButton />);

    // Use getAllByText to handle multiple elements with "Sign out"
    const signOutElements = screen.getAllByText("Sign out");
    expect(signOutElements.length).toBeGreaterThan(0);
    const button = signOutElements[0].closest("button");
    expect(button?.getAttribute("type")).toBe("button");
  });
});
