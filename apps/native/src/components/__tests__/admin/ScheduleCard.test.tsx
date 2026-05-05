import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "../helpers/renderWithProviders";
import { ScheduleCard } from "../../admin/schedules/ScheduleCard";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

describe("ScheduleCard", () => {
  const schedule = {
    id: "schedule-1",
    name: "Morning Update",
    triggerTime: "08:00",
    message: "Send a morning update",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastTriggered: null,
  } as any;

  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onToggle = jest.fn();
  const onTrigger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders schedule details", () => {
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={schedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    expect(getByText("Morning Update")).toBeTruthy();
    expect(getByText(/08:00/)).toBeTruthy();
    expect(getByText("Send a morning update")).toBeTruthy();
    expect(getByText("Active")).toBeTruthy();
  });

  it("calls the action handlers", () => {
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={schedule}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    fireEvent.press(getByText("Edit"));
    fireEvent.press(getByText("Trigger"));
    fireEvent.press(getByText("Pause"));
    fireEvent.press(getByText("Delete"));

    expect(onEdit).toHaveBeenCalledWith(schedule);
    expect(onTrigger).toHaveBeenCalledWith(schedule);
    expect(onToggle).toHaveBeenCalledWith(schedule);
    expect(onDelete).toHaveBeenCalledWith(schedule);
  });

  it("shows start and inactive when schedule is disabled", () => {
    const { getByText } = renderWithProviders(
      <ScheduleCard
        schedule={{ ...schedule, isActive: false }}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTrigger={onTrigger}
      />
    );

    expect(getByText("Inactive")).toBeTruthy();
    expect(getByText("Start")).toBeTruthy();
  });
});
