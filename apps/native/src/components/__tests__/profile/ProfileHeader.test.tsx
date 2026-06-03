import React from "react";
import { View } from "react-native";
import { waitFor } from "@testing-library/react-native";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { server, createORPCHandler } from "../../../test-utils/msw/server";
import { ProfileHeader } from "../../profile/ProfileHeader";

// Mock download function that returns a resolved promise
const mockDownload = jest.fn(() => Promise.resolve({ uri: "file://avatar.jpg" }));
const mockReset = jest.fn();
const mockAbort = jest.fn();

const mockUseFileDownload = jest.fn(() => ({
  download: mockDownload,
  status: "idle",
  file: null as { uri: string } | null,
  reset: mockReset,
  abort: mockAbort,
}));

jest.mock("expo-router", () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => mockUseFileDownload(),
}));

jest.mock("expo-image", () => ({
  Image: function MockImage(props: { source: { uri: string }; style: Record<string, unknown> }) {
    const { View } = require("react-native");
    return <View testID="profile-image" data-uri={props.source?.uri} style={props.style} />;
  },
}));

describe("ProfileHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    });
  });

  it("should render with default state when no user data", () => {
    server.use(createORPCHandler(["user", "getMy"], () => null));

    const { getByTestId } = renderWithMSW(<ProfileHeader />);

    const container = getByTestId("profile-header");
    expect(container).toBeTruthy();
  });

  it("should render user initials when no avatar", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("JD")).toBeTruthy());
  });

  it("should render user name", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("John Doe")).toBeTruthy());
  });

  it("should render role badge for USER role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("User")).toBeTruthy());
  });

  it("should render role badge for ADMIN role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "Admin",
        lastName: "User",
        hasAvatar: false,
        role: "ADMIN",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Administrator")).toBeTruthy());
  });

  it("should render role badge for MODERATOR role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "Mod",
        lastName: "User",
        hasAvatar: false,
        role: "MODERATOR",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Moderator")).toBeTruthy());
  });

  it("should render role badge for SERVICE role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "Service",
        lastName: "Account",
        hasAvatar: false,
        role: "SERVICE",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Service")).toBeTruthy());
  });

  it("should render avatar image when user has avatar", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: true,
        role: "USER",
        updatedAt: new Date("2024-01-01"),
      })),
    );

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "success",
      file: { uri: "file://avatar.jpg" },
      reset: mockReset,
      abort: mockAbort,
    });

    const { getByTestId } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByTestId("profile-image")).toBeTruthy());
  });

  it("should show loading text when avatar is downloading", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: true,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    mockUseFileDownload.mockReturnValue({
      download: mockDownload,
      status: "loading",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    });

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Loading...")).toBeTruthy());
  });

  it("should handle single name", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "Single",
        lastName: null,
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => {
      expect(getByText("Single")).toBeTruthy();
      expect(getByText("S")).toBeTruthy();
    });
  });

  it("should handle missing first name", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: null,
        lastName: "Doe",
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Doe")).toBeTruthy());
  });

  it("should handle missing last name", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: null,
        hasAvatar: false,
        role: "USER",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("John")).toBeTruthy());
  });

  it("should handle lowercase role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "admin",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("Administrator")).toBeTruthy());
  });

  it("should handle unknown role", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        hasAvatar: false,
        role: "UNKNOWN_ROLE",
        updatedAt: new Date(),
      })),
    );

    const { getByText } = renderWithMSW(<ProfileHeader />);

    await waitFor(() => expect(getByText("UNKNOWN_ROLE")).toBeTruthy());
  });
});
