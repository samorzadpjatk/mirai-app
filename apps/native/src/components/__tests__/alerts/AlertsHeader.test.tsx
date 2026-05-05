import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { AlertsHeader } from "../../alerts/AlertsHeader";

describe("AlertsHeader", () => {
  it("should render title and subtitle", () => {
    const { getByText } = renderWithProviders(
      <AlertsHeader title="Notifications" subtitle="View your alerts" />
    );

    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("View your alerts")).toBeTruthy();
  });

  it("should render different copy", () => {
    const { getByText } = renderWithProviders(
      <AlertsHeader title="Alert Center" subtitle="Manage your notifications" />
    );

    expect(getByText("Alert Center")).toBeTruthy();
    expect(getByText("Manage your notifications")).toBeTruthy();
  });
});
