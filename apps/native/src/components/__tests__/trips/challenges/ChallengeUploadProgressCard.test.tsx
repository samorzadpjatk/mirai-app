import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { ChallengeUploadProgressCard } from "../../../trips/challenges/ChallengeUploadProgressCard";

describe("ChallengeUploadProgressCard", () => {
  it("should render title", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard />
    );
    expect(getByText("Uploading submission")).toBeTruthy();
  });

  it("should render ActivityIndicator", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ChallengeUploadProgressCard />
    );
    const activityIndicator = UNSAFE_getByType(require("react-native").ActivityIndicator);
    expect(activityIndicator).toBeTruthy();
  });

  it("should show 'Preparing upload...' when progress is null", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={null} />
    );
    expect(getByText("Preparing upload...")).toBeTruthy();
  });

  it("should show 'Preparing upload...' when progress is undefined", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard />
    );
    expect(getByText("Preparing upload...")).toBeTruthy();
  });

  it("should show percentage when progress is 0", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={0} />
    );
    expect(getByText("0%")).toBeTruthy();
  });

  it("should show percentage when progress is 0.5", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={0.5} />
    );
    expect(getByText("50%")).toBeTruthy();
  });

  it("should show 100% when progress is 1", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={1} />
    );
    expect(getByText("100%")).toBeTruthy();
  });

  it("should clamp progress to 0 when negative", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={-0.5} />
    );
    expect(getByText("0%")).toBeTruthy();
  });

  it("should clamp progress to 100% when greater than 1", () => {
    const { getByText } = renderWithProviders(
      <ChallengeUploadProgressCard progress={1.5} />
    );
    expect(getByText("100%")).toBeTruthy();
  });

  it("should render progress bar track", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ChallengeUploadProgressCard progress={0.5} />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view).toBeTruthy();
  });

  it("should render with correct container styling", () => {
    const { UNSAFE_getByType } = renderWithProviders(
      <ChallengeUploadProgressCard progress={0.5} />
    );
    const view = UNSAFE_getByType(require("react-native").View);
    expect(view.props.style).toBeTruthy();
  });
});
