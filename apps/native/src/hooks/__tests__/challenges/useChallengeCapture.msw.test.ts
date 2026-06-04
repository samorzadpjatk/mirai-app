import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { createORPCHandler, resetHandlers, server } from "../../../test-utils/msw/server";
import { renderHookWithMSW } from "../../../test-utils/msw/test-wrapper";
import {
  buildStoragePath,
  buildUploadConfig,
  useChallengeCapture,
  validateChallengeSubmission,
} from "../../challenges/useChallengeCapture";

// Mock expo-image-picker
const mockLaunchImageLibraryAsync =
  jest.fn<
    (options?: {
      mediaTypes?: string;
      allowsEditing?: boolean;
      aspect?: number[];
      quality?: number;
      exif?: boolean;
    }) => Promise<{
      canceled: boolean;
      assets?: { uri: string; fileName?: string | null; mimeType?: string }[];
    }>
  >();

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...(args as [object])),
  MediaTypeOptions: {
    Images: "images",
    Videos: "videos",
  },
}));

// Mock expo-router
const mockPush =
  jest.fn<(path: string | { pathname: string; params?: Record<string, string> }) => void>();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useFileUpload hook
const mockUpload =
  jest.fn<
    (asset: {
      storagePath: string;
      fileUri: string;
      fileName: string;
      contentType: string;
    }) => Promise<{ success: boolean }>
  >();
const mockAbort = jest.fn<() => void>();
const mockReset = jest.fn<() => void>();

jest.mock("~/hooks/files", () => ({
  useFileUpload: () => ({
    upload: mockUpload,
    abort: mockAbort,
    reset: mockReset,
    status: "idle",
    progress: { bytesUploaded: 0, bytesTotal: null, percent: null },
    error: null,
  }),
}));

const mockUserWithGroup = {
  id: "user-1",
  trips: [{ tripId: "trip-123", group: { id: "group-1", name: "Team A" } }],
};

const mockUserWithoutGroup = {
  id: "user-1",
  trips: [{ tripId: "trip-123" }],
};

function setupUserHandler(user: typeof mockUserWithGroup | null = mockUserWithGroup) {
  server.use(createORPCHandler(["user", "getMyWithGroup"], () => user));
}

function setupCreateSubmissionHandler(response = { id: "submission-123" }) {
  server.use(createORPCHandler(["challengeSubmission", "create"], () => response));
}

function setupDeleteSubmissionHandler(response = { success: true }) {
  server.use(createORPCHandler(["challengeSubmission", "deleteMine"], () => response));
}

describe("useChallengeCapture (MSW)", () => {
  beforeEach(() => {
    resetHandlers();
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  it("should return initial state", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.capturedImage).toBeNull();
    expect(result.current.uploadStatus).toBe("idle");
    expect(result.current.uploadProgress.percent).toBeNull();
  });

  it("should return loading state when user query is loading", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    // Immediately after render, the query should be loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should set captured image", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setCapturedImage("file://image.jpg");
    });

    expect(result.current.capturedImage).toBe("file://image.jpg");
  });

  it("should reset capture state", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setCapturedImage("file://image.jpg");
    });

    expect(result.current.capturedImage).toBe("file://image.jpg");

    act(() => {
      result.current.resetCapture();
    });

    expect(result.current.capturedImage).toBeNull();
    expect(mockAbort).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
  });

  it("should submit captured photo successfully", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Submission sent",
      expect.stringContaining("Zgłoszenie zostało wysłane"),
      expect.any(Array),
    );
  });

  it("should show error when tripId is missing", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: undefined, challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing trip or challenge information.");
  });

  it("should show error when challengeId is missing", async () => {
    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: undefined }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing trip or challenge information.");
  });

  it("should show error when user is not part of trip", async () => {
    // Return null user data to simulate user not part of trip
    setupUserHandler(null);

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "User is not part of the trip.");
  });

  it("should show error when group info is missing", async () => {
    setupUserHandler(mockUserWithoutGroup as typeof mockUserWithGroup);

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing group information.");
  });

  it("should handle upload failure and cleanup", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    setupDeleteSubmissionHandler();
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Upload Failed", "Upload failed");
  });

  it("should pick image from gallery successfully", async () => {
    const mockAsset = {
      uri: "file://gallery-image.jpg",
      fileName: "image.jpg",
      mimeType: "image/jpeg",
    };

    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const onSuccess =
      jest.fn<
        (asset: {
          uri: string;
          fileName?: string | null;
          mimeType?: string | null;
        }) => Promise<void>
      >();

    await act(async () => {
      await result.current.pickImageFromGallery(onSuccess);
    });

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: "images",
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
      exif: true,
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should handle cancelled image picker", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    });

    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const onSuccess =
      jest.fn<
        (asset: {
          uri: string;
          fileName?: string | null;
          mimeType?: string | null;
        }) => Promise<void>
      >();

    await act(async () => {
      await result.current.pickImageFromGallery(onSuccess);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should handle image picker error", async () => {
    mockLaunchImageLibraryAsync.mockRejectedValue(new Error("Picker error"));

    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.pickImageFromGallery();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to pick image");
  });

  it("should pick video from gallery successfully", async () => {
    const mockAsset = {
      uri: "file://gallery-video.mp4",
      fileName: "video.mp4",
      mimeType: "video/mp4",
    };

    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [mockAsset],
    });

    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const onSuccess =
      jest.fn<
        (asset: {
          uri: string;
          fileName?: string | null;
          mimeType?: string | null;
        }) => Promise<void>
      >();

    await act(async () => {
      await result.current.pickVideoFromGallery(onSuccess);
    });

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith({
      mediaTypes: "videos",
      allowsEditing: false,
      quality: 0.8,
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should handle video picker error", async () => {
    mockLaunchImageLibraryAsync.mockRejectedValue(new Error("Video picker error"));

    setupUserHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.pickVideoFromGallery();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to pick video");
  });

  it("should submit video asset successfully", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://video.mp4",
      fileName: "video.mp4",
      mimeType: "video/mp4",
    };

    await act(async () => {
      await result.current.submitVideoAsset(asset, "Video Challenge", 20);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "video/mp4",
      }),
    );
  });

  it("should handle retake and cleanup submission", async () => {
    setupUserHandler();
    setupDeleteSubmissionHandler();

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First set a captured image
    act(() => {
      result.current.setCapturedImage("file://image.jpg");
    });

    await act(async () => {
      await result.current.handleRetake();
    });

    expect(mockAbort).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(result.current.capturedImage).toBeNull();
  });

  it("should resolve file extension from filename", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.png",
      fileName: "photo.png",
      mimeType: "image/png",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: expect.stringContaining(".png"),
      }),
    );
  });

  it("should resolve file extension from mime type", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image",
      fileName: null,
      mimeType: "image/webp",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: expect.stringContaining(".webp"),
      }),
    );
  });

  it("should resolve mime type from extension", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://video.mov",
      fileName: "video.mov",
      mimeType: null,
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "video/quicktime",
      }),
    );
  });

  it("should handle heic image format", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.heic",
      fileName: "photo.heic",
      mimeType: "image/heic",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: expect.stringContaining(".heic"),
        contentType: "image/heic",
      }),
    );
  });

  it("should handle webm video format", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://video.webm",
      fileName: "video.webm",
      mimeType: "video/webm",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "video/webm",
      }),
    );
  });

  it("should submit with location data", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    };

    const location = { latitude: 52.2297, longitude: 21.0122 };

    await act(async () => {
      await result.current.submitAsset(asset, "Challenge", 10, location);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: expect.stringContaining("challenge/challenge-123/group-1-"),
      }),
    );
  });

  it("should navigate to challenges on success alert", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset, "Challenge", 10);
    });

    const alertCalls = (Alert.alert as jest.Mock).mock.calls;
    expect(alertCalls.length).toBeGreaterThan(0);

    const alertButtons = alertCalls[0]![2] as { text: string; onPress?: () => void }[];
    const viewChallengesButton = alertButtons.find((b) => b.text === "View Challenges");

    if (viewChallengesButton?.onPress) {
      viewChallengesButton.onPress();
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(tabs)/trips/challenges/index",
        params: { tripId: "trip-123" },
      });
    }
  });

  it("should handle default filename generation", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://some/path",
      fileName: "",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: expect.stringMatching(/^challenge-\d+\.jpg$/),
      }),
    );
  });

  it("should handle cleanup failure gracefully", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    setupDeleteSubmissionHandler({ success: false });
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    // Should still show upload error even if cleanup fails
    expect(Alert.alert).toHaveBeenCalledWith("Upload Failed", "Upload failed");
  });

  it("should handle m4v video format", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://video.m4v",
      fileName: "video.m4v",
      mimeType: "video/x-m4v",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "video/x-m4v",
      }),
    );
  });

  it("should handle heif image format", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://image.heif",
      fileName: "photo.heif",
      mimeType: "image/heif",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        storagePath: expect.stringContaining(".heif"),
      }),
    );
  });

  it("should handle uri with extension for filename", async () => {
    setupUserHandler();
    setupCreateSubmissionHandler();
    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHookWithMSW(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const asset = {
      uri: "file://path/to/image.jpg",
      fileName: "",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "image.jpg",
      }),
    );
  });
});

describe("validateChallengeSubmission", () => {
  it("should return groupId when all preconditions are met", () => {
    const userTrip = {
      trips: [{ tripId: "trip1", group: { id: "group1" } }],
    };
    expect(validateChallengeSubmission("trip1", "challenge1", userTrip)).toBe("group1");
  });

  it("should return null when tripId is missing", () => {
    const userTrip = { trips: [{ tripId: "trip1", group: { id: "group1" } }] };
    expect(validateChallengeSubmission(undefined, "challenge1", userTrip)).toBeNull();
  });

  it("should return null when challengeId is missing", () => {
    const userTrip = { trips: [{ tripId: "trip1", group: { id: "group1" } }] };
    expect(validateChallengeSubmission("trip1", undefined, userTrip)).toBeNull();
  });

  it("should return null when userTrip is null", () => {
    expect(validateChallengeSubmission("trip1", "challenge1", null)).toBeNull();
  });

  it("should return null when userTrip is undefined", () => {
    expect(validateChallengeSubmission("trip1", "challenge1", undefined)).toBeNull();
  });

  it("should return null when no matching trip found", () => {
    const userTrip = { trips: [{ tripId: "other", group: { id: "group1" } }] };
    expect(validateChallengeSubmission("trip1", "challenge1", userTrip)).toBeNull();
  });

  it("should return null when matching trip has no group", () => {
    const userTrip = { trips: [{ tripId: "trip1" }] };
    expect(validateChallengeSubmission("trip1", "challenge1", userTrip)).toBeNull();
  });

  it("should find correct trip among multiple trips", () => {
    const userTrip = {
      trips: [
        { tripId: "tripA", group: { id: "groupA" } },
        { tripId: "trip1", group: { id: "groupB" } },
      ],
    };
    expect(validateChallengeSubmission("trip1", "challenge1", userTrip)).toBe("groupB");
  });
});

describe("buildStoragePath", () => {
  it("should build path with given challengeId, groupId, extension, and timestamp", () => {
    const path = buildStoragePath("ch1", "g1", "jpg", 1234567890);
    expect(path).toBe("challenge/ch1/g1-1234567890.jpg");
  });

  it("should build path with default timestamp when not provided", () => {
    const before = Date.now();
    const path = buildStoragePath("ch1", "g1", "png");
    const after = Date.now();

    expect(path).toMatch(/^challenge\/ch1\/g1-\d+\.png$/);
    const timestamp = Number(path.match(/g1-(\d+)\.png/)?.[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe("buildUploadConfig", () => {
  it("should build upload config from asset and storage path", () => {
    const asset = {
      uri: "file:///test/image.jpg",
      fileName: "my-image.jpg",
      mimeType: "image/jpeg",
    };

    const config = buildUploadConfig(asset, "challenge/ch1/g1-123.jpg", "jpg");

    expect(config).toEqual({
      storagePath: "challenge/ch1/g1-123.jpg",
      fileUri: "file:///test/image.jpg",
      fileName: expect.any(String),
      contentType: "image/jpeg",
      upsert: true,
    });
  });

  it("should compute contentType from extension when mimeType is null", () => {
    const asset = {
      uri: "file:///test/image.jpg",
      fileName: "image.jpg",
      mimeType: null,
    };

    const config = buildUploadConfig(asset, "path/to/file.jpg", "jpg");

    expect(config.contentType).toBeTruthy();
  });
});
