/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from "react";

import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "tamagui.config";
import LoginScreen from "~/app/auth/login";
import { useRouter } from "expo-router";
import type { UseLoginFormResult } from "@integral-2025-app/auth/client";

const mockUseLoginForm = jest.fn<UseLoginFormResult, []>();
jest.mock("@integral-2025-app/auth", () => ({
  useLoginForm: () => mockUseLoginForm(),
}));
jest.mock("expo-router");
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
);

describe("LoginScreen", () => {
  const mockSetEmail = jest.fn();
  const mockSetPassword = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockRouterReplace = jest.fn();
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      replace: mockRouterReplace,
      push: mockRouterPush,
    } as unknown as ReturnType<typeof useRouter>);

    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "",
        password: "",
        isLoading: false,
        error: null,
      },
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });
  });

  it("should render login form", () => {
    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Welcome Back")).toBeTruthy();
    expect(getByText("Sign in to continue to PJapp")).toBeTruthy();
    expect(getByPlaceholderText("your.email@example.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter your password")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should update email when typing", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    fireEvent.changeText(emailInput, "test@example.com");

    expect(mockSetEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should update password when typing", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const passwordInput = getByPlaceholderText("Enter your password");
    fireEvent.changeText(passwordInput, "password123");

    expect(mockSetPassword).toHaveBeenCalledWith("password123");
  });

  it("should call handleSubmit when sign in button is pressed", async () => {
    mockHandleSubmit.mockImplementation(async (onSuccess) => {
      onSuccess?.();
    });

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it("should navigate to home on successful login", async () => {
    mockHandleSubmit.mockImplementation(async (onSuccess) => {
      onSuccess?.();
    });

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const signInButton = getByText("Sign In");
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith("/");
    });
  });

  it("should display error message when login fails", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        password: "password123",
        isLoading: false,
        error: "Invalid credentials",
      },
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Invalid credentials")).toBeTruthy();
  });

  it("should show loading state when submitting", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        password: "password123",
        isLoading: true,
        error: null,
      },
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Signing In...")).toBeTruthy();
    expect(queryByText("Sign In")).toBeNull();
  });

  it("should disable inputs when loading", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        password: "password123",
        isLoading: true,
        error: null,
      },
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    const passwordInput = getByPlaceholderText("Enter your password");

    expect(emailInput.props.editable).toBe(false);
    expect(passwordInput.props.editable).toBe(false);
  });

  it("should navigate to signup when sign up link is pressed", () => {
    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const signUpLink = getByText("Sign Up");
    fireEvent.press(signUpLink);

    expect(mockRouterPush).toHaveBeenCalledWith("/auth/signup");
  });

  it("should display email in input when form state has email", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "prefilled@example.com",
        password: "",
        isLoading: false,
        error: null,
      },
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    expect(emailInput.props.value).toBe("prefilled@example.com");
  });

  it("should have secure text entry for password field", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const passwordInput = getByPlaceholderText("Enter your password");
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("should have correct keyboard type for email input", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    expect(emailInput.props.keyboardType).toBe("email-address");
    expect(emailInput.props.autoCapitalize).toBe("none");
    expect(emailInput.props.autoCorrect).toBe(false);
  });
});
