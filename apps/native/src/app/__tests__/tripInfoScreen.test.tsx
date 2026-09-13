import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";
import TripInfoScreen from "../(tabs)/trips/info";
import { createORPCHandler, resetHandlers, server } from "../../test-utils/msw/server";
import { renderWithMSW } from "../../test-utils/msw/test-wrapper";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ tripId: "trip-1" })),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  })),
}));

jest.mock("react-native-pdf", () => "Pdf");
jest.mock("react-native-webview", () => ({ WebView: "WebView" }));

const TRIP_ID = "trip-1";

function buildTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: TRIP_ID,
    name: "INTEGRAL 2026",
    startDate: "2026-09-16T00:00:00.000Z",
    endDate: "2026-09-20T00:00:00.000Z",
    backgroundImagePath: "images/trips/integral/background.png",
    ...overrides,
  };
}

function buildResource(overrides: Record<string, unknown> = {}) {
  return {
    type: "contact",
    label: "Kontakt",
    description: "+48 000 000 000",
    url: "",
    storagePath: "",
    fileName: "",
    publicUrl: "",
    iconName: "call",
    value: "+48000000000",
    sortOrder: 0,
    ...overrides,
  };
}

function mountScreen(resources: Array<Record<string, unknown>>, trip = buildTrip()) {
  // Every image the screen renders asks the backend to sign its storage path,
  // so the recorded paths are what the screen actually decided to display.
  const signedPaths: string[] = [];

  server.use(
    createORPCHandler(["trip", "getResources"], () => ({ resources, insurance: null })),
    createORPCHandler(["trip", "getByIdFull"], () => ({ trip })),
    createORPCHandler(["storage", "createDownloadUrl"], (input) => {
      const storagePath = String((input as { storagePath?: string }).storagePath ?? "");
      signedPaths.push(storagePath);
      return {
        signedUrl: `https://storage.example.org/${storagePath}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    }),
  );

  return { ...renderWithMSW(<TripInfoScreen />), signedPaths };
}

describe("TripInfoScreen (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    jest.spyOn(Linking, "openURL").mockImplementation(() => Promise.resolve(true));
  });

  /**
   * The screen used to show an SOS tile whose only action was an alert
   * repeating the emergency number. The organisers asked for a tile that
   * dials the crew on duty instead, so a tap has to reach the dialer and
   * must not open a dialog on the way.
   */
  it("dials the crew number from the contact tile without showing an alert", async () => {
    mountScreen([buildResource()]);

    const tile = await screen.findByTestId("trip-info-contact-tile");
    expect(screen.getByText("Kontakt")).toBeOnTheScreen();
    expect(screen.getByText("+48 000 000 000")).toBeOnTheScreen();

    fireEvent.press(tile);

    expect(Linking.openURL).toHaveBeenCalledWith("tel:+48000000000");
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("hides the contact tile when the trip has no crew number", async () => {
    mountScreen([buildResource({ value: "" })]);

    await waitFor(() => {
      expect(screen.getByTestId("trip-info-hero-title")).toBeOnTheScreen();
    });
    expect(screen.queryByTestId("trip-info-contact-tile")).toBeNull();
  });

  /**
   * The hero resource is optional seed content, while every trip carries a
   * background image. Without the fallback the header degraded to a flat
   * themed panel even though the app already had a photo of the trip.
   */
  it("falls back to the trip background image when no hero resource is seeded", async () => {
    const { signedPaths } = mountScreen([buildResource()]);

    await screen.findByTestId("trip-info-hero-image");
    await waitFor(() => {
      expect(signedPaths).toContain("images/trips/integral/background.png");
    });
  });

  it("prefers the seeded hero resource over the trip background image", async () => {
    const { signedPaths } = mountScreen([
      buildResource({
        type: "hero_image",
        label: "INTEGRAL 2026",
        iconName: "",
        value: "",
        description: "",
        storagePath: "images/trips/integral/hero-bg.png",
      }),
    ]);

    await screen.findByTestId("trip-info-hero-image");
    await waitFor(() => {
      expect(signedPaths).toContain("images/trips/integral/hero-bg.png");
    });
    expect(signedPaths).not.toContain("images/trips/integral/background.png");
  });

  /**
   * Both map tiles are optional. With neither of them seeded the row used to
   * render as an empty gap above the rest of the grid.
   */
  it("hides the map row when the trip has neither an interactive nor a PDF map", async () => {
    mountScreen([buildResource()]);

    await screen.findByTestId("trip-info-contact-tile");
    expect(screen.queryByTestId("trip-info-map-row")).toBeNull();
  });

  it("shows the map row when an interactive map is seeded", async () => {
    mountScreen([
      buildResource({
        type: "interactive_map",
        label: "Mapa ośrodka",
        description: "Plan ośrodka",
        url: "https://maps.example.org/integral",
        iconName: "compass",
        value: "",
      }),
    ]);

    expect(await screen.findByTestId("trip-info-map-row")).toBeOnTheScreen();
  });
});
