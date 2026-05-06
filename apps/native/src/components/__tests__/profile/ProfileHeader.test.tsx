import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ProfileHeader } from "../../profile/ProfileHeader";

const mockUseQuery = jest.fn(() => ({
  data: null,
  isLoading: false,
}));

// Mock download function that returns a resolved promise
const mockDownload = jest.fn(() => Promise.resolve({ uri: "file://avatar.jpg" }));
const mockReset = jest.fn();
const mockAbort = jest.fn();

const mockUseFileDownload = jest.fn(() => ({
  download: mockDownload,
  status: "idle",
  file: null,
  reset: mockReset,
  abort: mockAbort,
}));

jest.mock("@mirai-app/trpc/client", () => ({
  useTRPC: () => ({
    user: {
      getMy: {
        queryOptions: () => ({
          queryKey: ["user", "getMy"],
        }),
      },
    },
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("~/hooks/files", () => ({
  useFileDownload: (...args: unknown[]) => mockUseFileDownload(...args),
}));

jest.mock("expo-image", () => ({
  Image: function MockImage(props: { source: { uri: string }; style: Record<string, unknown> }) {
    const { View } = require("react-native");
    return (
      <View
        testID="profile-image"
        data-uri={props.source?.uri}
        style={props.style}
      />
    );
  },
}));

describe("ProfileHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });
    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    });
  });

  it("should render with default state when no user data", () => {
    const { UNSAFE_getByType } = renderWithProviders(<ProfileHeader />);

    const container = UNSAFE_getByType(View);
    expect(container).toBeTruthy();
  });

  it("should render user initials when no avatar", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("JD")).toBeTruthy();
  });

  it("should render user name", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("should render role badge for USER role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("User")).toBeTruthy();
  });

  it("should render role badge for ADMIN role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "Admin",
        lastName: "User",
        hasAvatar: false,
        role: "ADMIN",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Administrator")).toBeTruthy();
  });

  it("should render role badge for MODERATOR role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "Mod",
        lastName: "User",
        hasAvatar: false,
        role: "MODERATOR",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Moderator")).toBeTruthy();
  });

  it("should render role badge for SERVICE role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "Service",
        lastName: "Account",
        hasAvatar: false,
        role: "SERVICE",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Service")).toBeTruthy();
  });

  it("should render avatar image when user has avatar", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: true,
        role: "USER",
        updatedAt: new Date("2024-01-01"),
      },
      isLoading: false,
    });

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "success",
      file: { uri: "file://avatar.jpg" },
      reset: mockReset,
      abort: mockAbort,
    });

    const { getByTestId } = renderWithProviders(<ProfileHeader />);

    const image = getByTestId("profile-image");
    expect(image).toBeTruthy();
  });

  it("should show loading text when avatar is downloading", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: true,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "loading",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should handle single name", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "Single",
        lastName: null,
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Single")).toBeTruthy();
    expect(getByText("S")).toBeTruthy();
  });

  it("should handle missing first name", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: null,
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Doe")).toBeTruthy();
  });

  it("should handle missing last name", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: null,
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("John")).toBeTruthy();
  });

  it("should handle lowercase role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "admin",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("Administrator")).toBeTruthy();
  });

  it("should handle unknown role", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "UNKNOWN_ROLE",
        updatedAt: new Date(),
      },
      isLoading: false,
    });

    const { getByText } = renderWithProviders(<ProfileHeader />);

    expect(getByText("UNKNOWN_ROLE")).toBeTruthy();
  });
});
