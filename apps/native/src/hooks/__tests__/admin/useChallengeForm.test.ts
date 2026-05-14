import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useChallengeForm } from "../../admin/useChallengeForm";

// Mock expo-image-picker
const mockLaunchImageLibraryAsync = jest.fn<
  (options?: {
    mediaTypes?: string;
    allowsEditing?: boolean;
    aspect?: number[];
    quality?: number;
  }) => Promise<{
    canceled: boolean;
    assets: { uri: string; fileName?: string; mimeType?: string }[];
  }>
>();

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (options?: {
    mediaTypes?: string;
    allowsEditing?: boolean;
    aspect?: number[];
    quality?: number;
  }) => mockLaunchImageLibraryAsync(options),
  MediaTypeOptions: {
    Images: "images",
  },
}));

// Mock react-native Alert
const mockAlert = jest.fn();

// Mock useFileUpload hook
const mockUpload = jest.fn<() => Promise<{ path: string }>>();

jest.mock("~/hooks/files", () => ({
  useFileUpload: jest.fn(() => ({
    upload: mockUpload,
    status: "idle",
    progress: { percent: null },
    error: null,
  })),
}));

// Mock image utilities
jest.mock("~/utils/image", () => ({
  getImageExtension: jest.fn(() => "jpg"),
  getImageContentType: jest.fn(() => "image/jpeg"),
}));

// Mock challenge form constants
jest.mock("~/components/admin/challenges/challengeFormConstants", () => ({
  submissionTypes: [
    { value: "IMAGE", label: "Image" },
    { value: "VIDEO", label: "Video" },
    { value: "QR_CODE", label: "QR Code" },
    { value: "LOCATION", label: "Location" },
    { value: "TEXT", label: "Text" },
    { value: "IMAGE_LOCATION", label: "Image + Location" },
  ],
  scoringCategories: [
    { value: "SPEED", label: "Speed" },
    { value: "PEER_VOTING", label: "Peer Voting" },
    { value: "JUDGED_STAFF", label: "Judged by Staff" },
    { value: "UNLIMITED", label: "Unlimited" },
  ],
  statusOptions: [
    { value: "HIDDEN", label: "Hidden" },
    { value: "ACTIVE", label: "Active" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ],
  newChallengeStatusOptions: [
    { value: "HIDDEN", label: "Hidden" },
    { value: "ACTIVE", label: "Active" },
  ],
  toVotingDurationHours: jest.fn((value: string | null, unit: string) => {
    if (!value) return null;
    const num = parseInt(value, 10);
    if (unit === "DAYS") return num * 24;
    return num;
  }),
  toVotingDurationDraft: jest.fn(() => ({ value: "", unit: "HOURS" })),
  formatTime: jest.fn((date: Date | null) => (date ? "12:00" : "")),
  formatIso: jest.fn((date: Date | null) => (date ? date.toISOString() : "")),
  inferRecurringDaysFromWindow: jest.fn(() => "7"),
  toOptionalInt: jest.fn((value: string | null) => {
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }),
}));

describe("useChallengeForm", () => {
  const tripId = "trip-123";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
  });

  it("should initialize with default form state", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    expect(result.current.form.title).toBe("");
    expect(result.current.form.description).toBe("");
    expect(result.current.form.submissionType).toBe("IMAGE");
    expect(result.current.form.scoringCategory).toBe("SPEED");
    expect(result.current.form.status).toBe("HIDDEN");
    expect(result.current.form.isRecurring).toBe(false);
    expect(result.current.form.autoApprove).toBe(false);
  });

  it("should initialize with provided initialData", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test Challenge",
          description: "Test Description",
          submissionType: "QR_CODE",
        },
      }),
    );

    expect(result.current.form.title).toBe("Test Challenge");
    expect(result.current.form.description).toBe("Test Description");
    expect(result.current.form.submissionType).toBe("QR_CODE");
  });

  it("should update form fields", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.updateForm("title", "New Title");
    });

    expect(result.current.form.title).toBe("New Title");

    act(() => {
      result.current.updateForm("description", "New Description");
    });

    expect(result.current.form.description).toBe("New Description");
  });

  it("should handle submission type change", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.handleSubmissionTypeChange("QR_CODE");
    });

    expect(result.current.form.submissionType).toBe("QR_CODE");
    expect(result.current.form.qrCodeValue).toBe("");
  });

  it("should reset peer voting when submission type changes to non-image/video", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
        },
      }),
    );

    expect(result.current.form.scoringCategory).toBe("PEER_VOTING");

    act(() => {
      result.current.handleSubmissionTypeChange("TEXT");
    });

    expect(result.current.form.scoringCategory).toBe("SPEED");
    expect(result.current.form.votingDurationValue).toBe("");
  });

  it("should handle scoring category change", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      }),
    );

    act(() => {
      result.current.handleScoringChange("PEER_VOTING");
    });

    expect(result.current.form.scoringCategory).toBe("PEER_VOTING");
  });

  it("should show alert when trying to set peer voting for non-image/video", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "TEXT",
        },
      }),
    );

    act(() => {
      result.current.handleScoringChange("PEER_VOTING");
    });

    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Peer voting is available only for Image or Video challenges.",
    );
    expect(result.current.form.scoringCategory).toBe("SPEED");
  });

  it("should reset podium points when changing to UNLIMITED scoring", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          firstPlacePoints: "100",
          secondPlacePoints: "50",
          thirdPlacePoints: "25",
        },
      }),
    );

    act(() => {
      result.current.handleScoringChange("UNLIMITED");
    });

    expect(result.current.form.firstPlacePoints).toBe("");
    expect(result.current.form.secondPlacePoints).toBe("");
    expect(result.current.form.thirdPlacePoints).toBe("");
  });

  it("should validate form with missing title and description", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Please fill in title and description");
  });

  it("should validate form with valid title and description", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.updateForm("title", "Test Title");
      result.current.updateForm("description", "Test Description");
    });

    const isValid = result.current.validateForm();

    expect(isValid).toBe(true);
  });

  it("should validate location challenges require target location", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          submissionType: "LOCATION",
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Please select a location on the map for location challenges",
    );
  });

  it("should validate QR code challenges require qr code value", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          submissionType: "QR_CODE",
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Scan or provide expected QR code value.");
  });

  it("should validate recurring challenges require daily times", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          isRecurring: true,
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Provide daily start and end time");
  });

  it("should validate recurring days must be between 1 and 30", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          isRecurring: true,
          dailyStartTime: new Date(),
          dailyEndTime: new Date(),
          recurringDays: "35",
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Recurring days must be between 1 and 30");
  });

  it("should validate non-recurring challenges require both start and end times", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          isRecurring: false,
          startTime: new Date(),
          endTime: null,
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Provide both start and end time");
  });

  it("should validate start time must be before end time", () => {
    const startTime = new Date("2024-01-02T00:00:00Z");
    const endTime = new Date("2024-01-01T00:00:00Z");

    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          isRecurring: false,
          startTime,
          endTime,
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith("Error", "Start time must be before end time");
  });

  it("should validate peer voting requires voting duration", () => {
    const startTime = new Date("2024-01-01T00:00:00Z");
    const endTime = new Date("2024-01-02T00:00:00Z");

    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          startTime,
          endTime,
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Provide peer voting duration in hours or days (minimum 1).",
    );
  });

  it("should validate peer voting requires submission end time", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          votingDurationValue: "24",
          endTime: null,
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "Peer voting challenge requires submission end time",
    );
  });

  it("should validate text auto-approve requires expected phrase", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          title: "Test",
          description: "Test",
          submissionType: "TEXT",
          autoApprove: true,
          textExpectedPhrase: "",
        },
      }),
    );

    const isValid = result.current.validateForm();

    expect(isValid).toBe(false);
    expect(mockAlert).toHaveBeenCalledWith(
      "Error",
      "For text auto-approve, provide an expected phrase or disable auto-approve.",
    );
  });

  it("should provide correct derived state for peer voting", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
        },
      }),
    );

    expect(result.current.isPeerVoting).toBe(true);
    expect(result.current.canUsePeerVoting).toBe(true);
    expect(result.current.showPodiumPoints).toBe(true);
  });

  it("should provide correct derived state for unlimited scoring", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          scoringCategory: "UNLIMITED",
        },
      }),
    );

    expect(result.current.showPodiumPoints).toBe(false);
  });

  it("should provide correct derived state for QR code submission", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "QR_CODE",
        },
      }),
    );

    expect(result.current.isAutoApproveForced).toBe(true);
    expect(result.current.needsLocation).toBe(false);
  });

  it("should provide correct derived state for location submission", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "LOCATION",
        },
      }),
    );

    expect(result.current.isAutoApproveForced).toBe(true);
    expect(result.current.needsLocation).toBe(true);
  });

  it("should provide correct derived state for image submission", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "IMAGE",
        },
      }),
    );

    expect(result.current.isAutoApproveDisabled).toBe(true);
    expect(result.current.needsLocation).toBe(false);
  });

  it("should provide correct labels for selects", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          status: "HIDDEN",
        },
      }),
    );

    expect(result.current.submissionTypeLabel).toBe("Image");
    expect(result.current.scoringCategoryLabel).toBe("Speed");
    expect(result.current.statusLabel).toBe("Hidden");
  });

  it("should handle date picker open", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.openDatePicker("startTime");
    });

    expect(result.current.activePicker).toBe("startTime");

    act(() => {
      result.current.setActivePicker("endTime");
    });

    expect(result.current.activePicker).toBe("endTime");
  });

  it("should handle select open", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.setActiveSelect("submissionType");
    });

    expect(result.current.activeSelect).toBe("submissionType");
    expect(result.current.activeSelectOptions).toHaveLength(6);
  });

  it("should filter peer voting from scoring options when not image/video", () => {
    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: true,
        initialData: {
          submissionType: "TEXT",
        },
      }),
    );

    act(() => {
      result.current.setActiveSelect("scoringCategory");
    });

    // Should filter out PEER_VOTING
    expect(
      result.current.activeSelectOptions.some(
        (opt: { value: string }) => opt.value === "PEER_VOTING",
      ),
    ).toBe(false);
  });

  it("should handle location picker toggle", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    expect(result.current.showLocationPicker).toBe(false);

    act(() => {
      result.current.setShowLocationPicker(true);
    });

    expect(result.current.showLocationPicker).toBe(true);
  });

  it("should handle QR scanner toggle", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    expect(result.current.isQrScannerOpen).toBe(false);

    act(() => {
      result.current.setIsQrScannerOpen(true);
    });

    expect(result.current.isQrScannerOpen).toBe(true);

    act(() => {
      result.current.openQrScanner();
    });

    expect(result.current.isQrScannerOpen).toBe(true);
  });

  it("should initialize form from challenge data", () => {
    const challengeData = {
      id: "challenge-1",
      name: "Existing Challenge",
      description: "Existing Description",
      image: "/images/challenge.jpg",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      isRecurring: false,
      basePoints: 100,
      firstPlacePoints: 50,
      status: "ACTIVE",
    };

    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: false,
        challengeId: "challenge-1",
      }),
    );

    act(() => {
      result.current.initializeFormFromChallenge(challengeData);
    });

    expect(result.current.form.title).toBe("Existing Challenge");
    expect(result.current.form.description).toBe("Existing Description");
    expect(result.current.form.image).toBe("/images/challenge.jpg");
    expect(result.current.form.basePoints).toBe("100");
    expect(result.current.form.status).toBe("ACTIVE");
    expect(result.current.initializedChallengeId).toBe("challenge-1");
  });

  it("should normalize MULTI_IMAGE submission type to IMAGE", () => {
    const challengeData = {
      id: "challenge-1",
      name: "Test",
      submissionType: "MULTI_IMAGE",
      scoringCategory: "SPEED",
    };

    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: false,
      }),
    );

    act(() => {
      result.current.initializeFormFromChallenge(challengeData);
    });

    expect(result.current.form.submissionType).toBe("IMAGE");
  });

  it("should handle image upload successfully", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///test/image.jpg",
          fileName: "test.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });

    mockUpload.mockResolvedValue({ path: "challenge/trip-123/cover-1234567890.jpg" });

    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    await act(async () => {
      await result.current.handlePickImage();
    });

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalled();

    expect(mockUpload).toHaveBeenCalled();
    expect(result.current.form.image).toContain("challenge/trip-123/cover-");
    expect(result.current.imagePreviewUri).toBe("file:///test/image.jpg");
  });

  it("should handle cancelled image picker", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    });

    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    await act(async () => {
      await result.current.handlePickImage();
    });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("should handle image upload error", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///test/image.jpg",
          fileName: "test.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });

    mockUpload.mockRejectedValue(new Error("Upload failed"));

    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    await act(async () => {
      await result.current.handlePickImage();
    });

    expect(mockAlert).toHaveBeenCalledWith("Upload error", "Upload failed");
  });

  it("should not pick image without tripId", async () => {
    const { result } = renderHook(() => useChallengeForm({ tripId: "", isNewChallenge: true }));

    await act(async () => {
      await result.current.handlePickImage();
    });

    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("should provide utility functions", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    expect(typeof result.current.toOptionalInt).toBe("function");
    expect(typeof result.current.toVotingDurationHours).toBe("function");
    expect(typeof result.current.formatTime).toBe("function");
    expect(typeof result.current.formatIso).toBe("function");
  });

  it("should handle setImagePreviewUri", () => {
    const { result } = renderHook(() => useChallengeForm({ tripId, isNewChallenge: true }));

    act(() => {
      result.current.setImagePreviewUri("file:///new/image.jpg");
    });

    expect(result.current.imagePreviewUri).toBe("file:///new/image.jpg");
  });

  it("should track initial image separately from form image", () => {
    const challengeData = {
      id: "challenge-1",
      name: "Test",
      image: "/images/original.jpg",
    };

    const { result } = renderHook(() =>
      useChallengeForm({
        tripId,
        isNewChallenge: false,
        challengeId: "challenge-1",
      }),
    );

    act(() => {
      result.current.initializeFormFromChallenge(challengeData);
    });

    expect(result.current.initialImage).toBe("/images/original.jpg");
    expect(result.current.form.image).toBe("/images/original.jpg");
  });
});
