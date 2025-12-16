import { render } from "@testing-library/react-native";
import { useAuth, type AuthContextValue } from "@integral-2025-app/auth/client";
import { TamaguiProvider } from "tamagui";
import Home from "~/app/index";
import tamaguiConfig from "tamagui.config";

jest.mock("@integral-2025-app/auth/client", () => ({
  useAuth: jest.fn(),
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const wrapWithProvider = (ui: React.ReactElement) => (
  <TamaguiProvider config={tamaguiConfig}>{ui}</TamaguiProvider>
);

const renderWithProvider = (ui: React.ReactElement) =>
  render(wrapWithProvider(ui));

const createAuthValue = (
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  refreshSession: jest.fn(),
  ...overrides,
});

const hydratedSession = {
  user: {
    email: "test@example.com",
  },
} as never;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReset();
});

describe("Home", () => {
  it("should render without crashing", () => {
    mockUseAuth.mockReturnValue(
      createAuthValue({
        session: hydratedSession,
        isAuthenticated: true,
      }),
    );

    const { toJSON } = renderWithProvider(<Home />);
    expect(toJSON()).toBeTruthy();
  });

  it("should display the correct text", () => {
    mockUseAuth.mockReturnValue(
      createAuthValue({
        session: hydratedSession,
        isAuthenticated: true,
      }),
    );

    const { getByText } = renderWithProvider(<Home />);
    expect(getByText("Welcome Back!")).toBeTruthy();
    expect(getByText("test@example.com")).toBeTruthy();
    expect(getByText("View Users (tRPC Example)")).toBeTruthy();
    expect(getByText("PJapp Native • v0.0.0")).toBeTruthy();
  });

  it("should show a loading indicator when the auth state is loading", () => {
    mockUseAuth.mockReturnValue(
      createAuthValue({
        isLoading: true,
      }),
    );

    const { getByText } = renderWithProvider(<Home />);
    expect(getByText("Loading...")).toBeTruthy();
  });
});
