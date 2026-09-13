import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import AdminChallengesScreen from "../(tabs)/admin/challenges/index";
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

const TRIP_ID = "trip-1";

function buildChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: "challenge-1",
    tripId: TRIP_ID,
    name: "Podnieść banderę",
    description: "",
    image: "",
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    status: "HIDDEN",
    basePoints: 100,
    firstPlacePoints: 0,
    secondPlacePoints: 0,
    thirdPlacePoints: 0,
    autoApprove: false,
    isRecurring: false,
    startTime: null,
    endTime: null,
    votingStartTime: null,
    votingEndTime: null,
    participantGroupsCount: 0,
    pendingSubmissionsCount: 0,
    myGroupSubmissionStatus: null,
    ...overrides,
  };
}

function buildListResponse(challenges: Array<Record<string, unknown>>) {
  return {
    challenges,
    pagination: { total: challenges.length, limit: 30, offset: 0, hasMore: false },
  };
}

describe("AdminChallengesScreen (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  /**
   * The screen used to invalidate the list with a key built from `queryOptions`, which
   * carries `type: "query"` while the list itself is a `useInfiniteQuery` keyed with
   * `type: "infinite"`. Nothing matched, so a deleted challenge stayed on screen and the
   * staff read that as "it cannot be deleted".
   */
  it("refetches the list after deleting a challenge", async () => {
    let listCalls = 0;
    const deleted: Array<Record<string, unknown>> = [];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], () => {
        listCalls += 1;
        return buildListResponse(deleted.length > 0 ? [] : [buildChallenge()]);
      }),
      createORPCHandler(["challengeVote", "getJudgedStaffProgressByTrip"], () => ({})),
      createORPCHandler(["challenge", "delete"], (input) => {
        deleted.push(input as Record<string, unknown>);
        return { success: true };
      }),
    );

    renderWithMSW(<AdminChallengesScreen />);

    await waitFor(() => {
      expect(screen.getByText("Podnieść banderę")).toBeOnTheScreen();
    });
    const callsBeforeDelete = listCalls;

    fireEvent.press(screen.getByTestId("delete-challenge-challenge-1"));

    // The confirmation is a native Alert; run its destructive button by hand.
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls.at(-1) ?? [];
    const confirm = (buttons as Array<{ text: string; onPress?: () => void }>).find(
      (button) => button.text === "Delete",
    );
    confirm?.onPress?.();

    await waitFor(() => {
      expect(deleted).toHaveLength(1);
    });
    await waitFor(() => {
      expect(listCalls).toBeGreaterThan(callsBeforeDelete);
    });
    await waitFor(() => {
      expect(screen.queryByText("Podnieść banderę")).toBeNull();
    });
  });

  it("asks the list for recurring templates so they can be managed", async () => {
    const listInputs: Array<Record<string, unknown>> = [];

    server.use(
      createORPCHandler(["challenge", "getAllByTrip"], (input) => {
        listInputs.push(input as Record<string, unknown>);
        return buildListResponse([buildChallenge({ id: "template-1", isRecurring: true })]);
      }),
      createORPCHandler(["challengeVote", "getJudgedStaffProgressByTrip"], () => ({})),
    );

    renderWithMSW(<AdminChallengesScreen />);

    await waitFor(() => {
      expect(screen.getByText("Podnieść banderę")).toBeOnTheScreen();
    });

    expect(listInputs[0]).toMatchObject({
      tripId: TRIP_ID,
      includeRecurringTemplates: true,
    });
    expect(screen.getByText("Template")).toBeOnTheScreen();
  });
});
