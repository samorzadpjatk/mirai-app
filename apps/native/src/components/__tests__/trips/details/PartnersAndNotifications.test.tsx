import { screen, userEvent, waitFor } from "@testing-library/react-native";
import { NotificationsHeader } from "../../../notifications/NotificationsHeader";
import { type Partner, PartnersSection } from "../../../trips/details/PartnersSection";
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
