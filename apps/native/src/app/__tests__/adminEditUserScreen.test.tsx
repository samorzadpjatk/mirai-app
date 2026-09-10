import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import AdminEditUserScreen from "../(tabs)/admin/users/edit/[userId]";
import { createORPCHandler, resetHandlers, server } from "../../test-utils/msw/server";
import { renderWithMSW } from "../../test-utils/msw/test-wrapper";

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ userId: "user-1", tripId: "trip-1" })),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  })),
}));

const USER_ID = "user-1";
const TRIP_ID = "trip-1";
const RESPONSE_DELAY_MS = 40;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildUser() {
  return {
    id: USER_ID,
    authUserId: "auth-user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    hasAvatar: false,
    role: "USER",
    lastSeenOn: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    email: "ada@example.com",
  };
}

function buildParticipant(group: { id: string; name: string } | null) {
  return {
    id: USER_ID,
    firstName: "Ada",
    lastName: "Lovelace",
    organizerGroup: null,
    trips: [
      {
        id: "participant-1",
        userId: USER_ID,
        tripId: TRIP_ID,
        groupId: group?.id ?? null,
        wristNumber: "42",
        houseNumber: "7",
        group,
        trip: { id: TRIP_ID, name: "Integral 2026" },
      },
    ],
  };
}

function buildGroupsResponse(groups: Array<{ id: string; name: string }>) {
  return {
    groups: groups.map((group) => ({ ...group, tripId: TRIP_ID, _count: { participants: 0 } })),
    pagination: { total: groups.length, limit: 100, offset: 0, hasMore: false },
  };
}

/**
 * Registers the three read queries the screen fires on mount, each behind a
 * delay so the first render always happens with no data - exactly the cold-open
 * case where the old `useState(<query data>)` initialisers froze every field on
 * its empty fallback.
 */
function useDelayedScreenQueries(options: {
  group: { id: string; name: string } | null;
  availableGroups: Array<{ id: string; name: string }>;
}) {
  server.use(
    createORPCHandler(["user", "getById"], async () => {
      await sleep(RESPONSE_DELAY_MS);
      return buildUser();
    }),
    createORPCHandler(["user", "getByIdWithGroup"], async () => {
      await sleep(RESPONSE_DELAY_MS);
      return buildParticipant(options.group);
    }),
    createORPCHandler(["group", "getAll"], async () => {
      await sleep(RESPONSE_DELAY_MS);
      return buildGroupsResponse(options.availableGroups);
    }),
  );
}

describe("AdminEditUserScreen (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("hydrates every field once the delayed user queries resolve", async () => {
    useDelayedScreenQueries({
      group: { id: "group-1", name: "Red team" },
      availableGroups: [
        { id: "group-1", name: "Red team" },
        { id: "group-2", name: "Blue team" },
      ],
    });

    renderWithMSW(<AdminEditUserScreen />);

    // Cold open: the queries are still in flight, so the loading header shows
    // and no input exists yet.
    expect(screen.getByText("Loading user data...")).toBeOnTheScreen();
    expect(screen.queryByTestId("first-name-input")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("first-name-input")).toHaveProp("value", "Ada");
    });

    expect(screen.getByTestId("last-name-input")).toHaveProp("value", "Lovelace");
    expect(screen.getByTestId("wrist-number-input")).toHaveProp("value", "42");
    expect(screen.getByTestId("house-number-input")).toHaveProp("value", "7");
    expect(screen.getByText("ada@example.com")).toBeOnTheScreen();
  });

  it("enables Save and submits when the user has a name but no group at all", async () => {
    const updateNameInputs: Array<Record<string, unknown>> = [];
    const assignGroupInputs: Array<Record<string, unknown>> = [];

    useDelayedScreenQueries({ group: null, availableGroups: [] });
    server.use(
      createORPCHandler(["user", "updateName"], (input) => {
        updateNameInputs.push(input);
        return { success: true };
      }),
      createORPCHandler(["user", "updateWristNumber"], () => ({ success: true })),
      createORPCHandler(["user", "updateHouseNumber"], () => ({ success: true })),
      createORPCHandler(["group", "assignUserToGroup"], (input) => {
        assignGroupInputs.push(input);
        return { success: true };
      }),
    );

    renderWithMSW(<AdminEditUserScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("first-name-input")).toHaveProp("value", "Ada");
    });

    // The trip has no groups, so the old `disabled={... || !selectedGroupId}`
    // made the button impossible to enable.
    expect(screen.getByText("No groups available")).toBeOnTheScreen();
    expect(screen.getByTestId("save-changes-button")).toBeEnabled();

    fireEvent.press(screen.getByTestId("save-changes-button"));

    await waitFor(() => {
      expect(updateNameInputs).toHaveLength(1);
    });
    expect(updateNameInputs[0]).toEqual({
      userId: USER_ID,
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(assignGroupInputs).toHaveLength(0);
  });

  it("disables Save while a required name is empty", async () => {
    useDelayedScreenQueries({ group: null, availableGroups: [] });

    renderWithMSW(<AdminEditUserScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("first-name-input")).toHaveProp("value", "Ada");
    });

    fireEvent.changeText(screen.getByTestId("first-name-input"), "   ");

    expect(screen.getByTestId("save-changes-button")).toBeDisabled();
  });

  it("hydrates the selected group, so saving untouched does not reassign it", async () => {
    const assignGroupInputs: Array<Record<string, unknown>> = [];

    useDelayedScreenQueries({
      group: { id: "group-1", name: "Red team" },
      availableGroups: [
        { id: "group-1", name: "Red team" },
        { id: "group-2", name: "Blue team" },
      ],
    });
    server.use(
      createORPCHandler(["user", "updateName"], () => ({ success: true })),
      createORPCHandler(["user", "updateWristNumber"], () => ({ success: true })),
      createORPCHandler(["user", "updateHouseNumber"], () => ({ success: true })),
      createORPCHandler(["group", "assignUserToGroup"], (input) => {
        assignGroupInputs.push(input);
        return { success: true };
      }),
    );

    renderWithMSW(<AdminEditUserScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("first-name-input")).toHaveProp("value", "Ada");
    });

    fireEvent.press(screen.getByTestId("save-changes-button"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "User updated successfully.");
    });
    // The hydrated group matches the participant's current group, so no
    // reassignment is issued.
    expect(assignGroupInputs).toHaveLength(0);

    fireEvent.press(screen.getByTestId("group-option-group-2"));
    fireEvent.press(screen.getByTestId("save-changes-button"));

    await waitFor(() => {
      expect(assignGroupInputs).toHaveLength(1);
    });
    expect(assignGroupInputs[0]).toEqual({
      userId: USER_ID,
      groupId: "group-2",
      tripId: TRIP_ID,
    });
  });
});
