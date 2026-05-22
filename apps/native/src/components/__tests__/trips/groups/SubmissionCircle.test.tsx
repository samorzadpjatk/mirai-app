import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../../helpers/renderWithProviders";

const mockDownload = jest.fn(() => Promise.resolve());
const mockReset = jest.fn();
const mockAbort = jest.fn();

let mockFileDownloadReturn = {
  download: mockDownload,
  status: "idle",
  file: null,
  reset: mockReset,
  abort: mockAbort,
};

jest.mock("~/hooks/files", () => ({
  useFileDownload: () => mockFileDownloadReturn,
}));

const SubmissionCircle = require("../../../trips/groups/details/SubmissionCircle").default;

const baseSubmission = (overrides = {}) => ({
  submissionId: "sub-1",
  challengeId: "challenge-1",
  challengeTitle: "Test Challenge",
  imageStoragePath: "path/to/image.jpg",
  approvedAt: "2024-01-15T10:30:00Z",
  ...overrides,
});

describe("SubmissionCircle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };
  });

  it("renders challenge title", () => {
    const { getByText } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    expect(getByText("Test Challenge")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("submission-circle"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator when downloading", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "loading",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("renders image when file is loaded", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "success",
      file: { uri: "file:///path/to/image.jpg" },
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <SubmissionCircle submission={baseSubmission()} onPress={jest.fn()} />,
    );

    expect(getByTestId("submission-image")).toBeTruthy();
  });

  it("shows fallback when no image path", () => {
    mockFileDownloadReturn = {
      download: mockDownload,
      status: "idle",
      file: null,
      reset: mockReset,
      abort: mockAbort,
    };

    const { getByTestId } = renderWithProviders(
      <SubmissionCircle
        submission={baseSubmission({ imageStoragePath: "" })}
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId("image-fallback")).toBeTruthy();
  });
});
