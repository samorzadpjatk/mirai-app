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

function createFullTripResponse(trip: unknown) {
  return { trip, groups: [], challenges: [], sponsors: [], latestNews: [] };
}

const pirateTrip = {
  id: "trip-pirate",
  name: "Pirate Trip",
  description: "A pirate-themed adventure",
  startDate: "2026-07-01T00:00:00.000Z",
  endDate: "2026-07-10T00:00:00.000Z",
  backgroundImagePath: "",
  theme: "PIRATE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  groups: [],
};

describe("ThemedCard under the PIRATE trip theme (MSW)", () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(
      createORPCHandler(["trip", "getByIdFull"], () => createFullTripResponse(pirateTrip)),
    );
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
