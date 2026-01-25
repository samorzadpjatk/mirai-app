/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React from "react";

import {
  render,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react-native";
import SignupScreen from "~/app/auth/signup";
import { useRouter } from "expo-router";
import type { UseSignupFormResult } from "@integral-2025-app/auth/client";

const mockUseSignupForm = jest.fn<UseSignupFormResult, []>();
jest.mock("@integral-2025-app/auth", () => ({
  useSignupForm: () => mockUseSignupForm(),
}));
jest.mock("expo-router");
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

describe("SignupScreen", () => {
  const mockSetName = jest.fn();
  const mockSetEmail = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockRouterReplace = jest.fn();
  const mockRouterPush = jest.fn();
  const mockVerifyOtp = jest.fn();
  const mockClearSent = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseRouter.mockReturnValue({
      replace: mockRouterReplace,
      push: mockRouterPush,
    } as unknown as ReturnType<typeof useRouter>);

    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "",
        email: "",
        isLoading: false,
        isSent: false,
        error: null,
      },
      setName: mockSetName,
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

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render signup form", () => {
    const { getAllByText, getByText, getByPlaceholderText, queryByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getAllByText("Create Account")).toHaveLength(2);
    expect(getByText("Join PJapp today")).toBeTruthy();
    expect(getByPlaceholderText("John Doe")).toBeTruthy();
    expect(getByPlaceholderText("your.email@example.com")).toBeTruthy();
    // Password fields removed for OTP flow
    expect(queryByPlaceholderText("At least 6 characters")).toBeNull();
    expect(queryByPlaceholderText("Re-enter password")).toBeNull();
  });

  it("should update name when typing", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const nameInput = getByPlaceholderText("John Doe");
    act(() => {
      fireEvent.changeText(nameInput, "Jane Smith");
    });

    expect(mockSetName).toHaveBeenCalledWith("Jane Smith");
  });

  it("should update email when typing", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    act(() => {
      fireEvent.changeText(emailInput, "test@example.com");
    });

    expect(mockSetEmail).toHaveBeenCalledWith("test@example.com");
  });



  it("should call handleSubmit when create account button is pressed", async () => {
    mockHandleSubmit.mockResolvedValue(undefined);

    const { getByTestId } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const createButton = getByTestId("signup-submit-button");
    act(() => {
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it("should NOT navigate to home immediately after sending signup code and should show modal", async () => {
    mockHandleSubmit.mockResolvedValue(undefined);
    mockUseSignupForm.mockReturnValueOnce({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        isLoading: false,
        isSent: true,
        error: null,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: mockClearError,
      clearSent: mockClearSent,
    });

    const { getByTestId, getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const createButton = getByTestId("signup-submit-button");
    act(() => {
      fireEvent.press(createButton);
    });

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

  it("should display error message when signup fails", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        isLoading: false,
        error: "Email already exists",
        isSent: false,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getByText("Email already exists")).toBeTruthy();
  });

  it("should show loading state when submitting", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        isLoading: true,
        error: null,
        isSent: false,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: jest.fn(),
    });

    const { getByText, getByTestId } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getByText("Creating Account...")).toBeTruthy();
    const submitButton = getByTestId("signup-submit-button");
    expect(within(submitButton).queryByText("Create Account")).toBeNull();
  });

  it("should disable inputs when loading", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        isLoading: true,
        error: null,
        success: false,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      setConfirmPassword: mockSetConfirmPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const nameInput = getByPlaceholderText("John Doe");
    const emailInput = getByPlaceholderText("your.email@example.com");
    const passwordInput = getByPlaceholderText("At least 6 characters");
    const confirmInput = getByPlaceholderText("Re-enter password");

    expect(nameInput.props.editable).toBe(false);
    expect(emailInput.props.editable).toBe(false);
    expect(passwordInput.props.editable).toBe(false);
    expect(confirmInput.props.editable).toBe(false);
  });

  it("should show verification modal when signup code is sent", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        isLoading: false,
        error: null,
        isSent: true,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      clearSent: mockClearSent,
    });

    const { getByText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getByText('Enter verification code')).toBeTruthy();
  });

  it("should navigate to login when sign in link is pressed", () => {
    const { getByText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const signInLink = getByText("Sign In");
    act(() => {
      fireEvent.press(signInLink);
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/auth/login");
  });

  it("should NOT have password fields in OTP signup flow", () => {
    const { queryByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(queryByPlaceholderText("At least 6 characters")).toBeNull();
    expect(queryByPlaceholderText("Re-enter password")).toBeNull();
  });

  it("should have correct keyboard type for email input", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    expect(emailInput.props.keyboardType).toBe("email-address");
    expect(emailInput.props.autoCapitalize).toBe("none");
    expect(emailInput.props.autoCorrect).toBe(false);
  });

  it("should capitalize words for name input", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const nameInput = getByPlaceholderText("John Doe");
    expect(nameInput.props.autoCapitalize).toBe("words");
  });

  it("should display form state values in inputs", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "pass123",
        confirmPassword: "pass123",
        isLoading: false,
        error: null,
        success: false,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      setConfirmPassword: mockSetConfirmPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const nameInput = getByPlaceholderText("John Doe");
    const emailInput = getByPlaceholderText("your.email@example.com");

    expect(nameInput.props.value).toBe("Jane Smith");
    expect(emailInput.props.value).toBe("jane@example.com");
  });
});
