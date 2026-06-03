import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { waitFor } from "@testing-library/react-native";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { AccountInfoSection } from "../../profile/AccountInfoSection";

jest.mock("@expo/vector-icons", () => {
  const { View } = require("react-native");
  return {
    Ionicons: function MockIonicons({
      name,
      size,
      color,
    }: {
      name: string;
      size: number;
      color: string;
    }) {
      return <View testID={`icon-${name}`} style={{ width: size, height: size, color }} />;
    },
  };
});

describe("AccountInfoSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      })),
    );
  });

  it("should render section title and email label", async () => {
    const { getByText } = renderWithMSW(<AccountInfoSection />);
    expect(getByText("Account Information")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });

  it("should render email icon", async () => {
    const { getByTestId } = renderWithMSW(<AccountInfoSection />);
    expect(getByTestId("icon-mail")).toBeTruthy();
  });

  it("should render user email when data is available", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
      })),
    );
    const { getByText } = renderWithMSW(<AccountInfoSection />);
    await waitFor(() => expect(getByText("john.doe@example.com")).toBeTruthy());
  });

  it("should handle undefined email", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => ({
        id: "user-1",
        email: undefined,
        firstName: "John",
        lastName: "Doe",
      })),
    );
    const { getByText } = renderWithMSW(<AccountInfoSection />);
    await waitFor(() => expect(getByText("Email")).toBeTruthy());
  });

  it("should render info card container", async () => {
    const { getByTestId } = renderWithMSW(<AccountInfoSection />);
    expect(getByTestId("account-info-card")).toBeTruthy();
  });

  it("should render info row with icon and content", async () => {
    const { getByTestId, getByText } = renderWithMSW(<AccountInfoSection />);
    expect(getByTestId("icon-mail")).toBeTruthy();
    expect(getByText("Email")).toBeTruthy();
  });

  it("should handle loading state", async () => {
    server.use(
      createORPCHandler(
        ["user", "getMy"],
        () =>
          new Promise(() => {
            /* intentionally never resolves */
          }),
      ),
    );
    const { getByText } = renderWithMSW(<AccountInfoSection />);
    await waitFor(() => expect(getByText("Account Information")).toBeTruthy());
    await waitFor(() => expect(getByText("Email")).toBeTruthy());
  });

  it("should handle error state gracefully", async () => {
    server.use(
      createORPCHandler(["user", "getMy"], () => {
        throw new Error("Failed to load");
      }),
    );
    const { getByText } = renderWithMSW(<AccountInfoSection />);
    await waitFor(() => expect(getByText("Account Information")).toBeTruthy());
    await waitFor(() => expect(getByText("Email")).toBeTruthy());
  });
});
