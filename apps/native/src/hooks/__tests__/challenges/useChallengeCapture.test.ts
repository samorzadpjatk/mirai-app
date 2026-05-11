import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { useChallengeCapture } from "../../challenges/useChallengeCapture";
import { Alert } from "react-native";

// Mock expo-image-picker
const mockLaunchImageLibraryAsync = jest.fn<(options?: { mediaTypes?: string; allowsEditing?: boolean; aspect?: number[]; quality?: number; exif?: boolean }) => Promise<{ canceled: boolean; assets?: { uri: string; fileName?: string | null; mimeType?: string }[] }>>();

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args as [object]),
  MediaTypeOptions: {
    Images: "images",
    Videos: "videos",
  },
}));

// Mock expo-router
const mockPush = jest.fn<(path: string | { pathname: string; params?: Record<string, string> }) => void>();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock tRPC
jest.mock("@mirai-app/orpc/client", () => ({
  orpc: {
    user: {
      getMyWithGroup: {
        queryOptions: ({ input, enabled }: { input: { tripId: string }; enabled?: boolean }) => ({
          queryKey: ["user", "getMyWithGroup", input, enabled],
        }),
      },
    },
    challengeSubmission: {
      create: {
        mutationOptions: ({ onSuccess }: { onSuccess?: () => void | Promise<void> }) => ({
          mutationFn: jest.fn(),
          onSuccess,
        }),
      },
      deleteMine: {
        mutationOptions: ({ onSuccess }: { onSuccess?: () => void | Promise<void> }) => ({
          mutationFn: jest.fn(),
          onSuccess,
        }),
      },
    },
  },
}));

// Mock query invalidation
jest.mock("@mirai-app/orpc/client/query", () => ({
  invalidateChallengeQueries: jest.fn(),
}));

// Mock React Query
const mockUseQuery = jest.fn<() => { data: unknown; isLoading: boolean }>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseMutation = jest.fn<() => { mutateAsync: jest.Mock<any>; isPending: boolean }>();
const mockUseQueryClient = jest.fn<() => { invalidateQueries: jest.Mock }>();

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => mockUseQuery(),
  useMutation: () => mockUseMutation(),
  useQueryClient: () => mockUseQueryClient(),
}));

// Mock useFileUpload hook
const mockUpload = jest.fn<(asset: { storagePath: string; fileUri: string; fileName: string; contentType: string }) => Promise<{ success: boolean }>>();
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

describe("useChallengeCapture", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("should return initial state", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.capturedImage).toBeNull();
    expect(result.current.uploadStatus).toBe("idle");
    expect(result.current.uploadProgress.percent).toBeNull();
  });

  it("should return loading state when user query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should set captured image", () => {
    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    act(() => {
      result.current.setCapturedImage("file://image.jpg");
    });

    expect(result.current.capturedImage).toBe("file://image.jpg");
  });

  it("should reset capture state", () => {
    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

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
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1", name: "Team A" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(mockCreateSubmission).toHaveBeenCalledWith({
      tripId: "trip-123",
      challengeId: "challenge-123",
      imageIds: [expect.stringContaining("challenge/challenge-123/group-1-")],
      latitude: undefined,
      longitude: undefined,
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      "Submission sent",
      expect.stringContaining("Zgłoszenie zostało wysłane"),
      expect.any(Array)
    );
  });

  it("should show error when tripId is missing", async () => {
    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: undefined, challengeId: "challenge-123" })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing trip or challenge information.");
  });

  it("should show error when challengeId is missing", async () => {
    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: undefined })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing trip or challenge information.");
  });

  it("should show error when user is not part of trip", async () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "User is not part of the trip.");
  });

  it("should show error when group info is missing", async () => {
    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: null }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Missing group information.");
  });

  it("should handle upload failure and cleanup", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });
    const mockDeleteSubmission = jest.fn<(args: { id: string; tripId: string }) => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });
    const uploadError = new Error("Upload failed");

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreateSubmission,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockDeleteSubmission,
        isPending: false,
      });

    mockUpload.mockRejectedValue(uploadError);

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const photo = { uri: "file://photo.jpg", mimeType: "image/jpeg" as const };

    await act(async () => {
      await result.current.submitCapturedPhoto(photo, "Test Challenge", 10);
    });

    expect(mockDeleteSubmission).toHaveBeenCalledWith({
      id: "submission-123",
      tripId: "trip-123",
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

    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const onSuccess = jest.fn<(asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => Promise<void>>();

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

    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const onSuccess = jest.fn<(asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => Promise<void>>();

    await act(async () => {
      await result.current.pickImageFromGallery(onSuccess);
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should handle image picker error", async () => {
    mockLaunchImageLibraryAsync.mockRejectedValue(new Error("Picker error"));

    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

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

    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const onSuccess = jest.fn<(asset: { uri: string; fileName?: string | null; mimeType?: string | null }) => Promise<void>>();

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

    mockUseQuery.mockReturnValue({
      data: { id: "user-1", trips: [{ tripId: "trip-123", group: { id: "group-1" } }] },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    await act(async () => {
      await result.current.pickVideoFromGallery();
    });

    expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to pick video");
  });

  it("should submit video asset successfully", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; videoId?: string; imageIds?: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://video.mp4",
      fileName: "video.mp4",
      mimeType: "video/mp4",
    };

    await act(async () => {
      await result.current.submitVideoAsset(asset, "Video Challenge", 20);
    });

    expect(mockCreateSubmission).toHaveBeenCalledWith({
      tripId: "trip-123",
      challengeId: "challenge-123",
      videoId: expect.stringContaining("challenge/challenge-123/group-1-"),
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      contentType: "video/mp4",
    }));
  });

  it("should handle retake and cleanup submission", async () => {
    const mockDeleteSubmission = jest.fn<(args: { id: string; tripId: string }) => Promise<{ success: boolean }>>().mockResolvedValue({ success: true });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    // First set a submission ID
    act(() => {
      result.current.setCapturedImage("file://image.jpg");
    });

    // Mock the delete mutation for handleRetake
    mockUseMutation.mockReturnValueOnce({
      mutateAsync: mockDeleteSubmission,
      isPending: false,
    });

    await act(async () => {
      await result.current.handleRetake();
    });

    expect(mockAbort).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(result.current.capturedImage).toBeNull();
  });

  it("should resolve file extension from filename", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://image.png",
      fileName: "photo.png",
      mimeType: "image/png",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      storagePath: expect.stringContaining(".png"),
    }));
  });

  it("should resolve file extension from mime type", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://image",
      fileName: null,
      mimeType: "image/webp",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      storagePath: expect.stringContaining(".webp"),
    }));
  });

  it("should resolve mime type from extension", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://video.mov",
      fileName: "video.mov",
      mimeType: null,
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      contentType: "video/quicktime",
    }));
  });

  it("should handle heic image format", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://image.heic",
      fileName: "photo.heic",
      mimeType: "image/heic",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      storagePath: expect.stringContaining(".heic"),
      contentType: "image/heic",
    }));
  });

  it("should handle webm video format", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://video.webm",
      fileName: "video.webm",
      mimeType: "video/webm",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      contentType: "video/webm",
    }));
  });

  it("should submit with location data", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://image.jpg",
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
    };

    const location = { latitude: 52.2297, longitude: 21.0122 };

    await act(async () => {
      await result.current.submitAsset(asset, "Challenge", 10, location);
    });

    expect(mockCreateSubmission).toHaveBeenCalledWith(expect.objectContaining({
      latitude: 52.2297,
      longitude: 21.0122,
    }));
  });

  it("should navigate to challenges on success alert", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

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
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://some/path",
      fileName: "",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      fileName: expect.stringMatching(/^challenge-\d+\.jpg$/),
    }));
  });

  it("should handle cleanup failure gracefully", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });
    const mockDeleteSubmission = jest.fn<(args: { id: string; tripId: string }) => Promise<{ success: boolean }>>().mockRejectedValue(new Error("Delete failed"));

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation
      .mockReturnValueOnce({
        mutateAsync: mockCreateSubmission,
        isPending: false,
      })
      .mockReturnValueOnce({
        mutateAsync: mockDeleteSubmission,
        isPending: false,
      });

    mockUpload.mockRejectedValue(new Error("Upload failed"));

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

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
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://video.m4v",
      fileName: "video.m4v",
      mimeType: "video/x-m4v",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      contentType: "video/x-m4v",
    }));
  });

  it("should handle heif image format", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://image.heif",
      fileName: "photo.heif",
      mimeType: "image/heif",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      storagePath: expect.stringContaining(".heif"),
    }));
  });

  it("should handle uri with extension for filename", async () => {
    const mockCreateSubmission = jest.fn<(args: { tripId: string; challengeId: string; imageIds: string[]; latitude?: number; longitude?: number }) => Promise<{ id: string }>>().mockResolvedValue({ id: "submission-123" });

    mockUseQuery.mockReturnValue({
      data: {
        id: "user-1",
        trips: [{ tripId: "trip-123", group: { id: "group-1" } }],
      },
      isLoading: false,
    });

    mockUseMutation.mockReturnValue({
      mutateAsync: mockCreateSubmission,
      isPending: false,
    });

    mockUpload.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useChallengeCapture({ tripId: "trip-123", challengeId: "challenge-123" })
    );

    const asset = {
      uri: "file://path/to/image.jpg",
      fileName: "",
      mimeType: "image/jpeg",
    };

    await act(async () => {
      await result.current.submitAsset(asset);
    });

    expect(mockUpload).toHaveBeenCalledWith(expect.objectContaining({
      fileName: "image.jpg",
    }));
  });
});
