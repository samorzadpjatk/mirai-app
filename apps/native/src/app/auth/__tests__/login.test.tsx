/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from "react";

import { render, fireEvent, waitFor } from "@testing-library/react-native";
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
  <>{children}</>
);

describe("LoginScreen", () => {
  const mockSetEmail = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockClearSent = jest.fn();
  const mockClearError = jest.fn();
  const mockRouterReplace = jest.fn();
  const mockRouterPush = jest.fn();
  const mockVerifyOtp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({
      replace: mockRouterReplace,
      push: mockRouterPush,
    } as unknown as ReturnType<typeof useRouter>);

    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "",
        isLoading: false,
        isSent: false,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      clearSent: mockClearSent,
    });

    // mock useAuth verifyOtp
    (require("@integral-2025-app/auth") as any).useAuth = () => ({
      verifyOtp: mockVerifyOtp,
    });
  });

  it("should render login form", () => {
    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Welcome back")).toBeTruthy();
    expect(getByText("Unlock your next adventure with PJapp")).toBeTruthy();
    expect(getByPlaceholderText("your.email@example.com")).toBeTruthy();
    expect(getByText("Send Login Code")).toBeTruthy();
    expect(getByText("We'll send a one-time login code to your email. Use the code to sign in.")).toBeTruthy();
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



  it("should call handleSubmit when send code button is pressed", async () => {
    mockHandleSubmit.mockResolvedValue(undefined);

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const sendButton = getByText("Send Login Code");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it("should NOT navigate to home immediately after sending code and should show modal", async () => {
    mockHandleSubmit.mockResolvedValue(undefined);
    mockUseLoginForm.mockReturnValueOnce({
      formState: {
        email: "test@example.com",
        isLoading: false,
        isSent: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      clearSent: mockClearSent,
    });

    const { getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const sendButton = getByText("Send Login Code");
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
      expect(getByText('Enter verification code')).toBeTruthy();
    });

    // Enter OTP and verify
    const otpInput = getByPlaceholderText('123456');
    fireEvent.changeText(otpInput, '654321');

    mockVerifyOtp.mockResolvedValueOnce(undefined);

    const verifyButton = getByText('Verify & Sign In');
    fireEvent.press(verifyButton);

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({ email: 'test@example.com', token: '654321' });
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });

  it("should display error message when sending code fails", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        isLoading: false,
        error: "Invalid credentials",
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Invalid credentials")).toBeTruthy();

    // If OTP verification fails, show the modal error
    mockUseLoginForm.mockReturnValueOnce({
      formState: {
        email: "test@example.com",
        isLoading: false,
        isSent: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      clearSent: mockClearSent,
    });

    const { getByText: getByText2, getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const otpInput = getByPlaceholderText('123456');
    fireEvent.changeText(otpInput, '111111');

    mockVerifyOtp.mockRejectedValueOnce(new Error('Invalid code'));

    const verifyButton = getByText2('Verify & Sign In');
    fireEvent.press(verifyButton);

    return waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalled();
      expect(getByText2('Invalid code')).toBeTruthy();
    });
  });

  it("should show loading state when sending code", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        isLoading: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Sending Code...")).toBeTruthy();
    expect(queryByText("Send Login Code")).toBeNull();
  });

  it("should disable inputs when loading", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        isLoading: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");

    expect(emailInput.props.editable).toBe(false);
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
        isLoading: false,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    expect(emailInput.props.value).toBe("prefilled@example.com");
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

  it("should show confirmation when code was sent", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "test@example.com",
        isLoading: false,
        isSent: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    expect(getByText("Check your email — we sent a login link. You'll be signed in automatically after using it.")).toBeTruthy();
    expect(getByText("Resend Code")).toBeTruthy();
  });

  it("typing new email clears sent state", () => {
    mockUseLoginForm.mockReturnValue({
      formState: {
        email: "",
        isLoading: false,
        isSent: true,
        error: null,
      },
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      clearSent: mockClearSent,
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <LoginScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    fireEvent.changeText(emailInput, "new@example.com");

    expect(mockSetEmail).toHaveBeenCalledWith("new@example.com");
    expect(mockClearSent).toHaveBeenCalled();
  });
});
