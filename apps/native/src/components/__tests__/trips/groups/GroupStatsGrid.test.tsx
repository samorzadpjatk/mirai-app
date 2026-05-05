import React from "react";
import { renderWithProviders } from "../../helpers/renderWithProviders";
import { GroupStatsGrid } from "../../../trips/groups/details/GroupStatsGrid";

describe("GroupStatsGrid", () => {
  it("renders all stat labels", () => {
    const { getByText } = renderWithProviders(<GroupStatsGrid membersCount={5} coins={100} />);
    expect(getByText("Members")).toBeTruthy();
    expect(getByText("Coins")).toBeTruthy();
    expect(getByText("Position")).toBeTruthy();
  });

  it("formats values correctly", () => {
    const { getByText } = renderWithProviders(<GroupStatsGrid membersCount={5} coins={1000} rankingPosition={3} />);
    expect(getByText("5")).toBeTruthy();
    expect(getByText("1000")).toBeTruthy();
    expect(getByText("#3")).toBeTruthy();
  });

  it("shows a placeholder when ranking is missing", () => {
    const { getByText } = renderWithProviders(<GroupStatsGrid membersCount={5} coins={100} />);
    expect(getByText("--")).toBeTruthy();
  });
});
