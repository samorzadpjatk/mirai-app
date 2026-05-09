import React from "react";
import { View } from "react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AccountInfoSection } from "../../profile/AccountInfoSection";

const mockUseQuery = jest.fn((...args: unknown[]) => ({
  data: null as { id: string; email?: string; firstName: string; lastName: string } | null,
  isLoading: false,
  error: undefined as Error | undefined,
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
  useQuery: (...args: unknown[]) => mockUseQuery(args),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: function MockIonicons({ name, size, color }: { name: string; size: number; color: string }) {
      return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
    },
  };
});

describe("AccountInfoSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: undefined,
    });
  });

  it("should render section title", () => {
    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("Account Information")).toBeTruthy();
  });

  it("should render email label", () => {
    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("Email")).toBeTruthy();
  });

  it("should render email icon", () => {
    const { getByTestId } = renderWithProviders(<AccountInfoSection />);

    expect(getByTestId("icon-mail")).toBeTruthy();
  });

  it("should render user email when data is available", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
      },
      isLoading: false,
      error: undefined,
    });

    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("john.doe@example.com")).toBeTruthy();
  });

  it("should handle undefined email", () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        email: undefined,
        firstName: "John",
        lastName: "Doe",
      },
      isLoading: false,
      error: undefined,
    });

    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("Email")).toBeTruthy();
  });

  it("should render info card container", () => {
    const { getByTestId } = renderWithProviders(<AccountInfoSection />);

    expect(getByTestId("account-info-card")).toBeTruthy();
  });

  it("should render info row with icon and content", () => {
    const { getByTestId, getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByTestId("icon-mail")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });

  it("should call useQuery with correct options", () => {
    renderWithProviders(<AccountInfoSection />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["user", "getMy"],
      })
    );
  });

  it("should handle loading state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: undefined,
    });

    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("Account Information")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });

  it("should handle error state gracefully", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Failed to load"),
    });

    const { getByText } = renderWithProviders(<AccountInfoSection />);

    expect(getByText("Account Information")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });
});
