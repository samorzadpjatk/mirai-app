import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import EditChallengeScreen from "../(tabs)/admin/challenges/[id]";
import { createORPCHandler, resetHandlers, server } from "../../test-utils/msw/server";
import { renderWithMSW } from "../../test-utils/msw/test-wrapper";

// The editor mounts `useFileUpload`, which needs a Supabase provider it has no
// business having in a form test.
jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({
    upload: jest.fn(),
    abort: jest.fn(),
    reset: jest.fn(),
    status: "idle",
    progress: { bytesUploaded: 0, bytesTotal: null, percent: null },
    error: null,
    result: null,
  }),
  useFileDownload: () => ({
    download: jest.fn(),
    abort: jest.fn(),
    reset: jest.fn(),
    status: "idle",
    error: null,
    file: null,
  }),
  deleteCachedDownload: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: jest.fn(() => ({ id: "challenge-1", tripId: "trip-1" })),
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  })),
}));

function buildChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: "challenge-1",
    tripId: "trip-1",
    name: "Skarb na plazy",
    description: "opis",
    image: "",
    submissionType: "IMAGE_LOCATION",
    scoringCategory: "SPEED",
    status: "ACTIVE",
    basePoints: 10,
    firstPlacePoints: 0,
    secondPlacePoints: 0,
    thirdPlacePoints: 0,
    autoApprove: false,
    isRecurring: false,
    dailyStartTime: "",
    dailyEndTime: "",
    startTime: null,
    endTime: null,
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: 54.7653,
    targetLongitude: 17.561,
    qrCodeValue: "",
    textExpectedPhrase: "",
    ...overrides,
  };
}

describe("EditChallengeScreen (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  /**
   * Production evidence for this: a challenge was moved VISIBLE -> ACTIVE at 20:09
   * and was VISIBLE again ten minutes later, with no server path that writes
   * VISIBLE. The editor posts every field, so an untouched status coming from a
   * stale cache replayed the old value over the new one.
   */
  it("does not send a status the admin never touched", async () => {
    const updates: Array<Record<string, unknown>> = [];

    server.use(
      createORPCHandler(["challenge", "getById"], () => buildChallenge()),
      createORPCHandler(["challenge", "update"], (input) => {
        updates.push(input as Record<string, unknown>);
        return buildChallenge();
      }),
    );

    renderWithMSW(<EditChallengeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Update Challenge")).toBeOnTheScreen();
    });

    fireEvent.press(screen.getByText("Update Challenge"));

    await waitFor(() => {
      expect(updates).toHaveLength(1);
    });
    expect(updates[0]).not.toHaveProperty("status");
  });

  it("sends the status once the admin changes it", async () => {
    const updates: Array<Record<string, unknown>> = [];

    server.use(
      createORPCHandler(["challenge", "getById"], () => buildChallenge({ status: "VISIBLE" })),
      createORPCHandler(["challenge", "update"], (input) => {
        updates.push(input as Record<string, unknown>);
        return buildChallenge();
      }),
    );

    renderWithMSW(<EditChallengeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Update Challenge")).toBeOnTheScreen();
    });

    // Open the status picker and choose Active.
    fireEvent.press(screen.getAllByText("Visible")[0]!);
    await waitFor(() => {
      expect(screen.getByText("Active")).toBeOnTheScreen();
    });
    fireEvent.press(screen.getByText("Active"));

    fireEvent.press(screen.getByText("Update Challenge"));

    await waitFor(() => {
      expect(updates).toHaveLength(1);
    });
    expect(updates[0]).toMatchObject({ status: "ACTIVE" });
  });
});
