/// <reference lib="dom" />

import { describe, test, expect, mock } from "bun:test";
import { render, screen } from "@testing-library/react";
import { LoginApp } from "../LoginApp";

// Mock the dependencies
mock.module("../AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

mock.module("../LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">Login Form Component</div>,
}));

describe("[UNIT] LoginApp", () => {
  test("renders AuthProvider wrapper", () => {
    const { container } = render(<LoginApp />);

    expect(container.innerHTML).toContain("auth-provider");
  });

  test("renders LoginForm inside AuthProvider", () => {
    render(<LoginApp />);

    expect(screen.getByTestId("auth-provider")).toBeDefined();
    expect(screen.getByTestId("login-form")).toBeDefined();
  });

  test("LoginForm is nested within AuthProvider", () => {
    const { container } = render(<LoginApp />);

    const authProvider = container.querySelector(
      '[data-testid="auth-provider"]',
    );
    const loginForm = container.querySelector('[data-testid="login-form"]');

    // LoginForm should be a child of AuthProvider
    expect(authProvider?.contains(loginForm)).toBe(true);
  });
});
