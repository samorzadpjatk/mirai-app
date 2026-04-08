/// <reference lib="dom" />

import { describe, test, expect, beforeEach, mock } from "bun:test";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LogoutButton } from "../LogoutButton";

// Mock the logout function
const mockLogout = mock(() => Promise.resolve());

mock.module("../../lib/logout", () => ({
  logout: mockLogout,
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  test("renders sign out button", () => {
    render(<LogoutButton />);

    expect(screen.getByText("Sign out")).toBeDefined();
  });

  test("renders with custom className", () => {
    const { container } = render(<LogoutButton className="custom-class" />);

    expect(container.firstChild?.classList.contains("custom-class")).toBe(true);
  });

  test("calls logout when clicked", async () => {
    render(<LogoutButton />);

    const button = screen.getByText("Sign out");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test("shows loading state while logging out", async () => {
    // Delay the logout to check loading state
    mockLogout.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LogoutButton />);

    const button = screen.getByText("Sign out");
    fireEvent.click(button);

    // Button should show loading text
    await waitFor(() => {
      expect(screen.getByText("Signing out...")).toBeDefined();
    });
  });

  test("button is disabled while loading", async () => {
    mockLogout.mockImplementation(() => new Promise(() => {}));

    render(<LogoutButton />);

    const button = screen.getByText("Sign out");
    fireEvent.click(button);

    await waitFor(() => {
      const loadingButton = screen.getByText("Signing out...");
      expect(loadingButton.closest("button")?.disabled).toBe(true);
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

    const button = screen.getByText("Sign out").closest("button");
    expect(button?.getAttribute("type")).toBe("button");
  });
});
