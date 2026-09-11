import type { TripDetailTripSponsor } from "@mirai-app/orpc";
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { createDownloadUrlHandler } from "~/test-utils/msw/handlers";
import { server } from "~/test-utils/msw/server";
import { NotificationsHeader } from "../../../notifications/NotificationsHeader";
import { type Partner, PartnersSection, toPartners } from "../../../trips/details/PartnersSection";
import { renderWithProviders } from "../../helpers/renderWithProviders";

jest.mock("expo-router", () => {
  const mockPush = jest.fn();
  return {
    useRouter: jest.fn(() => ({
      push: mockPush,
    })),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

const useMockPush = () => {
  const { useRouter } = jest.requireMock("expo-router");
  return useRouter().push;
};

describe("PartnersSection", () => {
  beforeEach(() => {
    useMockPush().mockClear();
  });

  it("returns null when no sponsors provided", () => {
    renderWithProviders(<PartnersSection />);

    expect(screen.queryByText("Partners")).not.toBeOnTheScreen();
  });

  it("returns null when sponsors array is empty", () => {
    renderWithProviders(<PartnersSection sponsors={[]} />);

    expect(screen.queryByText("Partners")).not.toBeOnTheScreen();
  });

  it("renders partners and navigates on press", async () => {
    const user = userEvent.setup();
    const sponsors: Partner[] = [
      {
        id: "partner-1",
        name: "Partner One",
        logoPath: "/logo1.png",
        description: "Description 1",
        height: null,
        offsetX: null,
        offsetY: null,
      },
    ];

    renderWithProviders(<PartnersSection sponsors={sponsors} />);

    expect(screen.getByText("Partners")).toBeOnTheScreen();

    await waitFor(() => expect(screen.getByTestId("partner-logo")).toBeOnTheScreen());
    await user.press(screen.getByTestId("partner-logo"));
    expect(useMockPush()).toHaveBeenCalledWith("/trips/partners/partner-1");
  });

  it("asks for the logo variant so a wide wordmark is not cropped to a square", async () => {
    const inputs: Record<string, unknown>[] = [];
    server.use(
      createDownloadUrlHandler((input) => {
        inputs.push(input);
        return { signedUrl: "https://cdn.example.com/netcompany.webp" };
      }),
    );

    renderWithProviders(
      <PartnersSection
        sponsors={[
          {
            id: "partner-1",
            name: "Netcompany",
            logoPath: "sponsors/netcompany.png",
            description: "Description 1",
            height: null,
            offsetX: null,
            offsetY: null,
          },
        ]}
      />,
    );

    await waitFor(() =>
      expect(inputs[0]).toMatchObject({
        storagePath: "sponsors/netcompany.png",
        transform: "logo",
      }),
    );
  });
});

describe("toPartners", () => {
  const buildTripSponsor = (
    overrides: Partial<TripDetailTripSponsor> = {},
  ): TripDetailTripSponsor =>
    ({
      id: "ts-1",
      tripId: "trip-1",
      sponsorId: "netcompany",
      createdAt: new Date(),
      sponsor: {
        id: "netcompany",
        name: "Netcompany",
        description: "Partner",
        logoPath: "images/sponsors/netcompany.png",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      display: { height: 22, offsetX: 3, offsetY: -5 },
      ...overrides,
    }) as TripDetailTripSponsor;

  // Regression: the details screen used to hardcode null height/offsets, so the
  // seeded trip_sponsor_display layout never reached the logo.
  it("carries the per-trip logo layout over to the partner tile", () => {
    const [partner] = toPartners([buildTripSponsor()]);

    expect(partner).toMatchObject({
      id: "netcompany",
      name: "Netcompany",
      logoPath: "images/sponsors/netcompany.png",
      height: 22,
      offsetX: 3,
      offsetY: -5,
    });
  });

  it("keeps the default layout when the trip has no display row", () => {
    const [partner] = toPartners([
      buildTripSponsor({ display: { height: 0, offsetX: 0, offsetY: 0 } }),
    ]);

    expect(partner).toMatchObject({ height: 0, offsetX: 0, offsetY: 0 });
  });

  // Regression: `trip.getAll` shapes `tripSponsors` without `display` (the list
  // query never fetches trip_sponsor_display), so a list-shaped trip reaching this
  // mapper used to throw "Cannot read property 'height' of undefined" and take the
  // whole trip details screen down with a red render error.
  it("survives a sponsor entry that carries no display at all", () => {
    const withoutDisplay = buildTripSponsor();
    // biome-ignore lint/performance/noDelete: reproduces the wire shape exactly
    delete (withoutDisplay as { display?: unknown }).display;

    expect(() => toPartners([withoutDisplay])).not.toThrow();
    expect(toPartners([withoutDisplay])[0]).toMatchObject({
      id: "netcompany",
      height: null,
      offsetX: null,
      offsetY: null,
    });
  });

  it("drops entries whose sponsor could not be resolved", () => {
    expect(toPartners([buildTripSponsor({ sponsor: null })])).toEqual([]);
  });

  it("returns an empty list for an empty input", () => {
    expect(toPartners([])).toEqual([]);
  });
});

describe("NotificationsHeader", () => {
  it("renders default title and button", () => {
    renderWithProviders(<NotificationsHeader onCreate={jest.fn()} />);

    expect(screen.getByText("Notification Schedules")).toBeOnTheScreen();
    expect(screen.getByText("Create")).toBeOnTheScreen();
  });

  it("renders custom title and button label", () => {
    renderWithProviders(
      <NotificationsHeader title="Custom Title" buttonLabel="Add" onCreate={jest.fn()} />,
    );

    expect(screen.getByText("Custom Title")).toBeOnTheScreen();
    expect(screen.getByText("Add")).toBeOnTheScreen();
  });

  it("calls onCreate when button is pressed", async () => {
    const onCreate = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<NotificationsHeader onCreate={onCreate} />);

    await user.press(screen.getByText("Create"));
    expect(onCreate).toHaveBeenCalled();
  });
});
