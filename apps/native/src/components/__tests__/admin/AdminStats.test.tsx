import React from "react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import AdminStats from "../../admin/AdminStats";

describe("AdminStats", () => {
  it("renders with stats", () => {
    const { getByText } = renderWithProviders(
      <AdminStats stats={{ activeChallenges: 5, wintegralChallenges: 3 }} />
    );

    expect(getByText("Active")).toBeTruthy();
    expect(getByText("5")).toBeTruthy();
    expect(getByText("Wintegral")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
  });

  it("renders with zero stats", () => {
    const { getAllByText } = renderWithProviders(
      <AdminStats stats={{ activeChallenges: 0, wintegralChallenges: 0 }} />
    );

    expect(getAllByText("Active")).toBeTruthy();
    const zeroValues = getAllByText("0");
    expect(zeroValues.length).toBeGreaterThanOrEqual(2);
    expect(getAllByText("Wintegral")).toBeTruthy();
  });

  it("renders with large numbers", () => {
    const { getByText } = renderWithProviders(
      <AdminStats
        stats={{ activeChallenges: 999, wintegralChallenges: 888 }}
      />
    );

    expect(getByText("999")).toBeTruthy();
    expect(getByText("888")).toBeTruthy();
  });

  it("displays correct labels", () => {
    const { getByText } = renderWithProviders(
      <AdminStats stats={{ activeChallenges: 10, wintegralChallenges: 5 }} />
    );

    const activeLabel = getByText("Active");
    const wintegralLabel = getByText("Wintegral");

    expect(activeLabel).toBeTruthy();
    expect(wintegralLabel).toBeTruthy();
  });
});
