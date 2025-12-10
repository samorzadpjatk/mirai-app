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
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "tamagui.config";
import SignupScreen from "~/app/auth/signup";
import { useRouter } from "expo-router";
import type { UseSignupFormResult } from "@integral-2025-app/auth";

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
  <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
);

describe("SignupScreen", () => {
  const mockSetName = jest.fn();
  const mockSetEmail = jest.fn();
  const mockSetPassword = jest.fn();
  const mockSetConfirmPassword = jest.fn();
  const mockHandleSubmit = jest.fn();
  const mockRouterReplace = jest.fn();
  const mockRouterPush = jest.fn();

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
        password: "",
        confirmPassword: "",
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render signup form", () => {
    const { getAllByText, getByText, getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getAllByText("Create Account")).toHaveLength(2);
    expect(getByText("Join PJapp today")).toBeTruthy();
    expect(getByPlaceholderText("John Doe")).toBeTruthy();
    expect(getByPlaceholderText("your.email@example.com")).toBeTruthy();
    expect(getByPlaceholderText("At least 6 characters")).toBeTruthy();
    expect(getByPlaceholderText("Re-enter password")).toBeTruthy();
  });

  it("should update name when typing", async () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const nameInput = getByPlaceholderText("John Doe");
    await act(async () => {
      fireEvent.changeText(nameInput, "Jane Smith");
    });

    expect(mockSetName).toHaveBeenCalledWith("Jane Smith");
  });

  it("should update email when typing", async () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const emailInput = getByPlaceholderText("your.email@example.com");
    await act(async () => {
      fireEvent.changeText(emailInput, "test@example.com");
    });

    expect(mockSetEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should update password when typing", async () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const passwordInput = getByPlaceholderText("At least 6 characters");
    await act(async () => {
      fireEvent.changeText(passwordInput, "password123");
    });

    expect(mockSetPassword).toHaveBeenCalledWith("password123");
  });

  it("should update confirm password when typing", async () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const confirmInput = getByPlaceholderText("Re-enter password");
    await act(async () => {
      fireEvent.changeText(confirmInput, "password123");
    });

    expect(mockSetConfirmPassword).toHaveBeenCalledWith("password123");
  });

  it("should call handleSubmit when create account button is pressed", async () => {
    mockHandleSubmit.mockImplementation(async (onSuccess) => {
      onSuccess?.();
    });

    const { getByTestId } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const createButton = getByTestId("signup-submit-button");
    await act(async () => {
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it("should navigate to home after successful signup with delay", async () => {
    mockHandleSubmit.mockImplementation(async (onSuccess) => {
      onSuccess?.();
    });

    const { getByTestId } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const createButton = getByTestId("signup-submit-button");
    await act(async () => {
      fireEvent.press(createButton);
    });

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockRouterReplace).toHaveBeenCalledWith("/");
  });

  it("should display error message when signup fails", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        isLoading: false,
        error: "Email already exists",
        success: false,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      setConfirmPassword: mockSetConfirmPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
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

  it("should show success screen after successful signup", () => {
    mockUseSignupForm.mockReturnValue({
      formState: {
        name: "John Doe",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        isLoading: false,
        error: null,
        success: true,
      },
      setName: mockSetName,
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      setConfirmPassword: mockSetConfirmPassword,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
    });

    const { getByText, queryByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    expect(getByText("Welcome Aboard!")).toBeTruthy();
    expect(
      getByText("Your account has been created successfully"),
    ).toBeTruthy();
    expect(queryByPlaceholderText("John Doe")).toBeNull();
  });

  it("should navigate to login when sign in link is pressed", async () => {
    const { getByText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const signInLink = getByText("Sign In");
    await act(async () => {
      fireEvent.press(signInLink);
    });

    expect(mockRouterPush).toHaveBeenCalledWith("/auth/login");
  });

  it("should have secure text entry for password fields", () => {
    const { getByPlaceholderText } = render(
      <TestWrapper>
        <SignupScreen />
      </TestWrapper>,
    );

    const passwordInput = getByPlaceholderText("At least 6 characters");
    const confirmInput = getByPlaceholderText("Re-enter password");

    expect(passwordInput.props.secureTextEntry).toBe(true);
    expect(confirmInput.props.secureTextEntry).toBe(true);
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
    const passwordInput = getByPlaceholderText("At least 6 characters");
    const confirmInput = getByPlaceholderText("Re-enter password");

    expect(nameInput.props.value).toBe("Jane Smith");
    expect(emailInput.props.value).toBe("jane@example.com");
    expect(passwordInput.props.value).toBe("pass123");
    expect(confirmInput.props.value).toBe("pass123");
  });
});
