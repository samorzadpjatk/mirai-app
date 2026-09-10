import { screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { TripThemeProvider } from "~/theme/TripThemeProvider";
import { createORPCHandler, server } from "../../../test-utils/msw/server";
import { renderWithMSW } from "../../../test-utils/msw/test-wrapper";
import { ThemedCard } from "../../common/ui/ThemedCard";

// WoodTexture (rendered inside ThemedCard) uses expo-image's <Image>. Give it a
// stable testID so we can assert its presence/absence without depending on the
// mocked component's internal markup.
jest.mock("expo-image", () => ({
  Image: function MockImage(props: Record<string, unknown>) {
    const { View } = require("react-native");
    return <View testID="wood-texture-image" {...props} />;
  },
}));

describe("ThemedCard under the PIRATE trip theme (MSW)", () => {
  beforeEach(() => {
    server.resetHandlers();
    // TripThemeProvider reads the theme through the light `trip.getTheme` endpoint,
    // not through the full trip payload.
    server.use(createORPCHandler(["trip", "getTheme"], () => ({ theme: "PIRATE" })));
  });

  it("renders the wood-grain texture only once the trip resolves to PIRATE, not on the initial DEFAULT render", async () => {
    renderWithMSW(
      <TripThemeProvider tripId="trip-pirate">
        <ThemedCard>
          <Text>Loot</Text>
        </ThemedCard>
      </TripThemeProvider>,
    );

    // TripThemeProvider falls back to DEFAULT until the trip query resolves;
    // under DEFAULT, WoodTexture (the mocked expo-image Image) renders nothing.
    expect(screen.queryByTestId("wood-texture-image")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("wood-texture-image")).toBeOnTheScreen();
    });
  });
});
