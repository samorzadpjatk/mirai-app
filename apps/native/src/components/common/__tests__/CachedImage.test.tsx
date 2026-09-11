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

  it("asks the server for a sized variant when a transform is given", async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      createDownloadUrlHandler((input) => {
        inputs.push(input);
        return { signedUrl: "https://cdn.example.com/small.webp" };
      }),
    );

    renderWithProviders(
      <CachedImage
        testID="cached-image"
        storagePath="trips/integral/hero.jpg"
        transform="tripTile"
        style={{ width: 130, height: 52 }}
      />,
    );

    await waitFor(() => {
      expect(inputs[0]).toMatchObject({
        storagePath: "trips/integral/hero.jpg",
        transform: "tripTile",
      });
    });
  });

  it("omits the transform when the caller did not ask for one", async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      createDownloadUrlHandler((input) => {
        inputs.push(input);
        return { signedUrl: "https://cdn.example.com/original.jpg" };
      }),
    );

    renderWithProviders(
      <CachedImage
        testID="cached-image"
        storagePath="trips/integral/hero.jpg"
        style={{ width: 130, height: 52 }}
      />,
    );

    await waitFor(() => {
      expect(inputs[0]).toBeDefined();
    });
    expect(inputs[0]).not.toHaveProperty("transform");
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
