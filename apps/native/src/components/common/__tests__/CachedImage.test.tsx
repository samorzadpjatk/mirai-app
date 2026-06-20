import { screen, waitFor } from "@testing-library/react-native";
import { View } from "react-native";
import { createDownloadUrlHandler } from "~/test-utils/msw/handlers";
import { server } from "~/test-utils/msw/server";
import { renderWithProviders } from "../../__tests__/helpers/renderWithProviders";
import { CachedImage } from "../CachedImage";

describe("CachedImage", () => {
  it("renders direct source immediately without fetching", () => {
    renderWithProviders(
      <CachedImage
        testID="cached-image"
        source={{ uri: "https://example.com/image.png" }}
        style={{ width: 100, height: 100 }}
      />,
    );

    expect(screen.getByTestId("cached-image")).toBeOnTheScreen();
  });

  it("resolves storagePath via createDownloadUrl and renders", async () => {
    server.use(
      createDownloadUrlHandler(() => ({
        signedUrl: "https://cdn.example.com/signed-image.png",
      })),
    );

    renderWithProviders(
      <CachedImage
        testID="cached-image"
        storagePath="photos/trip.jpg"
        style={{ width: 100, height: 100 }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("cached-image")).toBeOnTheScreen();
    });
  });

  it("renders fallback when no source or storagePath is provided", () => {
    renderWithProviders(
      <CachedImage
        testID="cached-image"
        fallback={<View testID="fallback-view" />}
        style={{ width: 100, height: 100 }}
      />,
    );

    expect(screen.getByTestId("fallback-view")).toBeOnTheScreen();
  });
});
